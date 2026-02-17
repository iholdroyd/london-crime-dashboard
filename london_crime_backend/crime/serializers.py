from rest_framework import serializers
from .models import CrimeRecord


class CrimeRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrimeRecord
        fields = '__all__'


class BoroughTotalSerializer(serializers.Serializer):
    area_name = serializers.CharField()
    total_count = serializers.IntegerField()


class TimeSeriesSerializer(serializers.Serializer):
    month_year = serializers.CharField()
    total_count = serializers.IntegerField()


class OffenceBreakdownSerializer(serializers.Serializer):
    label = serializers.CharField()
    total_count = serializers.IntegerField()


class SummarySerializer(serializers.Serializer):
    total_offences = serializers.IntegerField()
    twelve_month_change_pct = serializers.FloatField(allow_null=True)
    one_month_change_pct = serializers.FloatField(allow_null=True)
    latest_month = serializers.CharField()
    earliest_month = serializers.CharField()
