"""
Management command to download and import the MPS Monthly Crime data.

Usage:
    python manage.py import_crime_data          # Download if missing, then import
    python manage.py import_crime_data --force   # Re-download and re-import
"""
import os

import pandas as pd
import requests
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
            self._convert_to_csv(excel_path, csv_path)
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

    def _convert_to_csv(self, excel_path, csv_path):
        """Convert XLSX to CSV, keeping only the columns we need."""
        self.stdout.write('Converting XLSX to CSV (this may take a few minutes)...')

        df = pd.read_excel(excel_path, engine='openpyxl')
        self.stdout.write(f'  → {len(df)} rows read from XLSX')

        # Keep only the columns we use and rename them
        available_cols = [c for c in COLUMNS_TO_KEEP.keys() if c in df.columns]
        df = df[available_cols]
        df = df.rename(columns=COLUMNS_TO_KEEP)

        df.to_csv(csv_path, index=False)

        # Report size savings
        xlsx_size = os.path.getsize(excel_path) / (1024 * 1024)
        csv_size = os.path.getsize(csv_path) / (1024 * 1024)
        self.stdout.write(self.style.SUCCESS(
            f'  → Converted: {xlsx_size:.1f} MB (XLSX) → {csv_size:.1f} MB (CSV)'
        ))

        # Optionally remove the XLSX to save disk space
        os.remove(excel_path)
        self.stdout.write(f'  → Removed XLSX file to save disk space')

    def _import(self, csv_path):
        self.stdout.write('Reading CSV file...')

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
