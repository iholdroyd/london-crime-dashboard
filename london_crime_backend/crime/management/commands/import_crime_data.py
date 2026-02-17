"""
Management command to download and import the MPS Monthly Crime data.

Usage:
    python manage.py import_crime_data          # Download if missing, then import
    python manage.py import_crime_data --force   # Re-download and re-import
"""
import io
import os

import pandas as pd
import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from crime.models import CrimeRecord


EXCEL_FILENAME = 'MonthlyCrimeDashboard_TNOCrimeData.xlsx'

# Column mapping: Excel column name -> model field name
COLUMN_MAP = {
    'Month_Year': 'month_year',
    'Area Type': 'area_type',
    'Borough_SNT': 'borough_snt',
    'Area name': 'area_name',
    'Area code': 'area_code',
    'Offence Group': 'offence_group',
    'Offence Subgroup': 'offence_subgroup',
    'Measure': 'measure',
    'Financial Year': 'financial_year',
    'FY_FYIndex': 'fy_index',
    'Count': 'count',
    'Refresh Date': 'refresh_date',
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
        force = options['force']

        # Step 1: Download if needed
        if not excel_path.exists() or force:
            self._download(excel_path)
        else:
            self.stdout.write(self.style.SUCCESS(
                f'Using cached file: {excel_path}'
            ))

        # Step 2: Parse and import
        self._import(excel_path)

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
        self.stdout.write(self.style.SUCCESS(f'Saved to {dest_path}'))

    def _import(self, excel_path):
        self.stdout.write('Reading Excel file (this may take a few minutes)...')

        df = pd.read_excel(
            excel_path,
            engine='openpyxl',
        )

        self.stdout.write(f'  → {len(df)} rows, {len(df.columns)} columns')
        self.stdout.write(f'  → Columns: {list(df.columns)}')

        # Rename columns
        df = df.rename(columns=COLUMN_MAP)

        # Keep only mapped columns (in case there are extras)
        expected = list(COLUMN_MAP.values())
        available = [c for c in expected if c in df.columns]
        df = df[available]

        # Clean data
        df = df.fillna({
            'area_type': '',
            'borough_snt': '',
            'area_name': '',
            'area_code': '',
            'offence_group': '',
            'offence_subgroup': '',
            'measure': '',
            'financial_year': '',
            'refresh_date': '',
            'count': 0,
        })

        # Convert month_year to string for consistent storage
        df['month_year'] = df['month_year'].astype(str)
        df['refresh_date'] = df['refresh_date'].astype(str)
        df['count'] = pd.to_numeric(df['count'], errors='coerce').fillna(0).astype(int)

        if 'fy_index' in df.columns:
            df['fy_index'] = pd.to_numeric(df['fy_index'], errors='coerce')

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
                record_data = {}
                for field in available:
                    val = row[field]
                    # Convert NaN/NaT to None for nullable fields
                    if pd.isna(val):
                        val = None
                    record_data[field] = val
                records.append(CrimeRecord(**record_data))

            CrimeRecord.objects.bulk_create(records)

            pct = (end / total) * 100
            self.stdout.write(f'  → {end}/{total} ({pct:.0f}%)')

        self.stdout.write(self.style.SUCCESS(
            f'Successfully imported {total} crime records.'
        ))

        # Print summary stats
        boroughs = CrimeRecord.objects.values_list('area_name', flat=True).distinct().count()
        offence_groups = CrimeRecord.objects.values_list('offence_group', flat=True).distinct().count()
        months = CrimeRecord.objects.values_list('month_year', flat=True).distinct().count()
        self.stdout.write(f'  → {boroughs} unique areas')
        self.stdout.write(f'  → {offence_groups} offence groups')
        self.stdout.write(f'  → {months} distinct months')
