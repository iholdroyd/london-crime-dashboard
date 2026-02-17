from django.db import models


class CrimeRecord(models.Model):
    """
    Represents a single row from the MPS Monthly Crime Dashboard Excel data.
    """
    month_year = models.CharField(max_length=20, db_index=True)
    area_type = models.CharField(max_length=50, blank=True, default='')
    borough_snt = models.CharField(max_length=100, blank=True, default='')
    area_name = models.CharField(max_length=150, db_index=True)
    area_code = models.CharField(max_length=20, blank=True, default='')
    offence_group = models.CharField(max_length=150, db_index=True)
    offence_subgroup = models.CharField(max_length=200, blank=True, default='')
    measure = models.CharField(max_length=50, blank=True, default='')
    financial_year = models.CharField(max_length=20, blank=True, default='')
    fy_index = models.IntegerField(null=True, blank=True)
    count = models.IntegerField(default=0)
    refresh_date = models.CharField(max_length=30, blank=True, default='')

    class Meta:
        indexes = [
            models.Index(fields=['month_year', 'area_name']),
            models.Index(fields=['month_year', 'offence_group']),
            models.Index(fields=['area_name', 'offence_group']),
        ]

    def __str__(self):
        return f"{self.month_year} | {self.area_name} | {self.offence_group}: {self.count}"
