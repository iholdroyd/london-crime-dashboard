from django.contrib import admin
from .models import CrimeRecord


@admin.register(CrimeRecord)
class CrimeRecordAdmin(admin.ModelAdmin):
    list_display = ('month_year', 'area_name', 'offence_group', 'count')
    list_filter = ('area_name', 'offence_group')
    search_fields = ('area_name', 'offence_group', 'offence_subgroup')
