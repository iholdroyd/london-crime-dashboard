"""
Management command to download and import the MPS Monthly Crime data.

Usage:
    python manage.py import_crime_data          # Download if missing, then import
    python manage.py import_crime_data --force   # Re-download and re-import
"""
import csv
import os

import pandas as pd
import requests
from openpyxl import load_workbook
from django.conf import settings
from django.core.management.base import BaseCommand

from crime.models import CrimeRecord


EXCEL_FILENAME = 'MonthlyCrimeDashboard_TNOCrimeData.xlsx'
CSV_FILENAME = 'MonthlyCrimeDashboard_TNOCrimeData.csv'

# Only the columns we actually use in the dashboard
COLUMNS_TO_KEEP = {
    'Month_Year': 'month_year',
    'Area Type': 'area_type',
    'Area name': 'area_name',
    'Offence Group': 'offence_group',
    'Offence Subgroup': 'offence_subgroup',
    'Count': 'count',
}


class Command(BaseCommand):
    help = 'Download and import the MPS Monthly Crime Dashboard data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force re-download even if the cached file exists',
        )

    def handle(self, *args, **options):
        excel_path = settings.DATA_DIR / EXCEL_FILENAME
        csv_path = settings.DATA_DIR / CSV_FILENAME
        force = options['force']

        # Step 1: Download XLSX if needed
        if not csv_path.exists() or force:
            self._download(excel_path)
            self._convert_to_csv_streaming(excel_path, csv_path)
        else:
            self.stdout.write(self.style.SUCCESS(
                f'Using cached CSV: {csv_path}'
            ))

        # Step 2: Import from CSV (much faster than XLSX)
        self._import(csv_path)

    def _download(self, dest_path):
        url = settings.CRIME_DATA_EXCEL_URL
        self.stdout.write(f'Downloading data from {url} ...')

        headers = {
            'User-Agent': (
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/91.0.4472.124 Safari/537.36'
            )
        }

        response = requests.get(url, headers=headers, stream=True, timeout=300)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0

        with open(dest_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                f.write(chunk)
                downloaded += len(chunk)
                if total_size:
                    pct = (downloaded / total_size) * 100
                    self.stdout.write(
                        f'\r  Downloaded {downloaded // (1024*1024)} MB '
                        f'/ {total_size // (1024*1024)} MB  ({pct:.0f}%)',
                        ending=''
                    )

        self.stdout.write('')  # newline
        self.stdout.write(self.style.SUCCESS(f'Saved XLSX to {dest_path}'))

    def _convert_to_csv_streaming(self, excel_path, csv_path):
        """
        Convert XLSX to CSV using openpyxl streaming (read_only=True).
        This avoids loading the entire file into memory, preventing OOM crashes on small instances.
        """
        self.stdout.write('Converting XLSX to CSV (streaming mode)...')
        self.stdout.write('  → Opening workbook (this may take a moment)...')

        # Load workbook in read-only mode (streaming)
        wb = load_workbook(excel_path, read_only=True, data_only=True)
        ws = wb.active

        # Get rows generator
        rows = ws.rows
        
        # Read header row
        try:
            header_row = next(rows)
            headers = [cell.value for cell in header_row]
        except StopIteration:
            self.stdout.write(self.style.ERROR('Empty Excel file'))
            return

        # Map Excel column names to indices
        col_indices = {}
        for col_name, field_name in COLUMNS_TO_KEEP.items():
            try:
                idx = headers.index(col_name)
                col_indices[field_name] = idx
            except ValueError:
                self.stdout.write(self.style.WARNING(f'Column "{col_name}" not found in Excel'))

        # Prepare CSV output
        with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=COLUMNS_TO_KEEP.values())
            writer.writeheader()

            count = 0
            for row in rows:
                row_data = {}
                # Extract only the columns we need
                for field_name, idx in col_indices.items():
                    val = row[idx].value if idx < len(row) else None
                    row_data[field_name] = val
                
                # FILTER: Only keep data from 2023 onwards
                # This reduces DB size and significantly speeds up imports/queries
                month_val = row_data.get('month_year')
                if month_val:
                    # Convert to string for comparison (works for datetime objs or str)
                    # "2023..." >= "2023" is True. "2022..." is False.
                    if str(month_val) < '2023':
                        continue

                writer.writerow(row_data)
                count += 1
                
                if count % 50000 == 0:
                    self.stdout.write(f'  → Processed {count} rows...', ending='\r')

        self.stdout.write(f'  → Processed {count} rows total.')
        
        # Cleanup
        wb.close()

        # Report size savings
        xlsx_size = os.path.getsize(excel_path) / (1024 * 1024)
        csv_size = os.path.getsize(csv_path) / (1024 * 1024)
        self.stdout.write(self.style.SUCCESS(
            f'  → Converted: {xlsx_size:.1f} MB (XLSX) → {csv_size:.1f} MB (CSV)'
        ))

        # Remove the XLSX to save disk space
        os.remove(excel_path)
        self.stdout.write(f'  → Removed XLSX file')

    def _import(self, csv_path):
        self.stdout.write('Reading CSV file...')

        # Pandas is fine for CSV reading (much lower RAM overhead than chunks of XML)
        # But we can also use chunksize if we really needed to be safe, 
        # though read_csv is generally efficient enough for 75MB on 512MB RAM.
        df = pd.read_csv(csv_path, dtype=str)
        self.stdout.write(f'  → {len(df)} rows, {len(df.columns)} columns')

        # Clean data
        df = df.fillna({
            'area_type': '',
            'area_name': '',
            'offence_group': '',
            'offence_subgroup': '',
            'count': '0',
        })

        df['month_year'] = df['month_year'].astype(str)
        df['count'] = pd.to_numeric(df['count'], errors='coerce').fillna(0).astype(int)

        # Title-case offence names (e.g. "THEFT" -> "Theft")
        if 'offence_group' in df.columns:
            df['offence_group'] = df['offence_group'].str.title()
        if 'offence_subgroup' in df.columns:
            df['offence_subgroup'] = df['offence_subgroup'].str.title()

        # Clear existing data
        self.stdout.write('Clearing existing records...')
        CrimeRecord.objects.all().delete()

        # Bulk create in batches
        batch_size = 5000
        total = len(df)
        self.stdout.write(f'Importing {total} records in batches of {batch_size}...')

        for start in range(0, total, batch_size):
            end = min(start + batch_size, total)
            batch = df.iloc[start:end]

            records = []
            for _, row in batch.iterrows():
                records.append(CrimeRecord(
                    month_year=row['month_year'],
                    area_type=row.get('area_type', ''),
                    area_name=row.get('area_name', ''),
                    offence_group=row.get('offence_group', ''),
                    offence_subgroup=row.get('offence_subgroup', ''),
                    count=row.get('count', 0),
                ))

            CrimeRecord.objects.bulk_create(records)

            pct = (end / total) * 100
            self.stdout.write(f'  → {end}/{total} ({pct:.0f}%)')

        self.stdout.write(self.style.SUCCESS(
            f'Successfully imported {total} crime records.'
        ))

        # Print summary stats
        areas = CrimeRecord.objects.values_list('area_name', flat=True).distinct().count()
        offence_groups = CrimeRecord.objects.values_list('offence_group', flat=True).distinct().count()
        months = CrimeRecord.objects.values_list('month_year', flat=True).distinct().count()
        self.stdout.write(f'  → {areas} unique areas')
        self.stdout.write(f'  → {offence_groups} offence groups')
        self.stdout.write(f'  → {months} distinct months')
