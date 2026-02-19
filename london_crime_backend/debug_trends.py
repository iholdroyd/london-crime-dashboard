
import os
import django
from datetime import datetime
from dateutil.relativedelta import relativedelta
from django.db.models import Sum

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from crime.models import CrimeRecord

def debug_summary():
    latest_month = '2026-01-01'
    print(f"Testing for latest_month: {latest_month}")
    
    # Check if month exists
    exists = CrimeRecord.objects.filter(month_year=latest_month).exists()
    print(f"Does {latest_month} exist? {exists}")
    
    # Snapshot Logic
    ref_date = datetime.strptime(latest_month, '%Y-%m-%d')
    date_fmt = '%Y-%m-%d'

    # 1-month prev
    prev_1_date = ref_date - relativedelta(months=1)
    prev_1 = prev_1_date.strftime(date_fmt)
    print(f"Prev 1 target: {prev_1}")
    
    count_1 = CrimeRecord.objects.filter(month_year=prev_1).aggregate(t=Sum('count'))['t']
    print(f"Count for {prev_1}: {count_1}")

    # 12-month prev
    prev_12_date = ref_date - relativedelta(months=12)
    prev_12 = prev_12_date.strftime(date_fmt)
    print(f"Prev 12 target: {prev_12}")
    
    count_12 = CrimeRecord.objects.filter(month_year=prev_12).aggregate(t=Sum('count'))['t']
    print(f"Count for {prev_12}: {count_12}")

if __name__ == '__main__':
    debug_summary()
