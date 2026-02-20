from django.db.models import Sum, Count
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import CrimeRecord
from .serializers import (
    BoroughTotalSerializer,
    TimeSeriesSerializer,
    OffenceBreakdownSerializer,
    SummarySerializer,
)


def _apply_filters(queryset, request):
    """Apply common query filters from request params."""
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    borough = request.query_params.get('borough')
    offence_group = request.query_params.get('offence_group')
    offence_groups = request.query_params.get('offence_groups')  # comma-separated
    offence_subgroup = request.query_params.get('offence_subgroup')
    area_type = request.query_params.get('area_type')

    if start_date:
        queryset = queryset.filter(month_year__gte=start_date)
    if end_date:
        queryset = queryset.filter(month_year__lte=end_date)
    if borough:
        queryset = queryset.filter(area_name=borough)
    if offence_group:
        queryset = queryset.filter(offence_group=offence_group)
    elif offence_groups:
        groups_list = [g.strip() for g in offence_groups.split(',') if g.strip()]
        queryset = queryset.filter(offence_group__in=groups_list)
    if offence_subgroup:
        queryset = queryset.filter(offence_subgroup=offence_subgroup)
    if area_type:
        queryset = queryset.filter(area_type=area_type)

    return queryset


@api_view(['GET'])
def summary(request):
    """
    Returns KPI summary data: total offences, 12-month and 1-month trends.

    In "snapshot" mode (single month selected), trends compare that month
    to 1 and 12 months prior using the same borough/offence filters.
    In "range" mode (multiple months), trends compare halves of the range.
    """
    from dateutil.relativedelta import relativedelta
    from datetime import datetime

    qs = _apply_filters(CrimeRecord.objects.all(), request)

    # Get all distinct months in filtered data, sorted
    months = sorted(
        qs.values_list('month_year', flat=True).distinct()
    )

    if not months:
        return Response({
            'total_offences': 0,
            'twelve_month_change_pct': None,
            'one_month_change_pct': None,
            'latest_month': '',
            'earliest_month': '',
        })

    latest_month = months[-1]
    earliest_month = months[0]

    # Total offences
    total = qs.aggregate(total=Sum('count'))['total'] or 0

    twelve_month_change = None
    one_month_change = None

    # Build a "comparison" queryset that uses same non-date filters
    def _comparison_qs():
        """Same filters as main qs but without date constraints."""
        cqs = CrimeRecord.objects.all()
        borough = request.query_params.get('borough')
        offence_group = request.query_params.get('offence_group')
        offence_subgroup = request.query_params.get('offence_subgroup')
        area_type = request.query_params.get('area_type')
        if borough:
            cqs = cqs.filter(area_name=borough)
        if offence_group:
            cqs = cqs.filter(offence_group=offence_group)
        if offence_subgroup:
            cqs = cqs.filter(offence_subgroup=offence_subgroup)
        if area_type:
            cqs = cqs.filter(area_type=area_type)
        return cqs

    if len(months) == 1:
        # SNAPSHOT MODE: compare single month vs 1-month-ago and 12-months-ago
        try:
            # Handle YYYY-MM-DD HH:MM:SS, YYYY-MM-DD and YYYY-MM formats
            if len(latest_month) >= 19:
                ref_date = datetime.strptime(latest_month[:19], '%Y-%m-%d %H:%M:%S')
                date_fmt = '%Y-%m-%d %H:%M:%S'
            elif len(latest_month) == 10:  # YYYY-MM-DD
                ref_date = datetime.strptime(latest_month, '%Y-%m-%d')
                date_fmt = '%Y-%m-%d'
            else:
                ref_date = datetime.strptime(latest_month, '%Y-%m')
                date_fmt = '%Y-%m'
        except ValueError:
            ref_date = None

        if ref_date:
            cqs = _comparison_qs()

            # Generate comparison date strings in same format as data
            # (date_fmt is computed above)

            # 1-month trend
            prev_1_date = ref_date - relativedelta(months=1)
            prev_1 = prev_1_date.strftime(date_fmt)
            current_total = total  # already computed
            prev_1_total = cqs.filter(month_year=prev_1).aggregate(
                total=Sum('count'))['total'] or 0
            if prev_1_total > 0:
                one_month_change = round(
                    ((current_total - prev_1_total) / prev_1_total) * 100, 2
                )

            # 12-month trend
            prev_12_date = ref_date - relativedelta(months=12)
            prev_12 = prev_12_date.strftime(date_fmt)
            prev_12_total = cqs.filter(month_year=prev_12).aggregate(
                total=Sum('count'))['total'] or 0
            if prev_12_total > 0:
                twelve_month_change = round(
                    ((current_total - prev_12_total) / prev_12_total) * 100, 2
                )
    else:
        # RANGE MODE: original logic
        # 12-month trend: compare last 12 months vs previous 12 months
        if len(months) >= 24:
            recent_12 = months[-12:]
            prev_12 = months[-24:-12]

            recent_total = qs.filter(month_year__in=recent_12).aggregate(
                total=Sum('count'))['total'] or 0
            prev_total = qs.filter(month_year__in=prev_12).aggregate(
                total=Sum('count'))['total'] or 0

            if prev_total > 0:
                twelve_month_change = round(
                    ((recent_total - prev_total) / prev_total) * 100, 2
                )

        # 1-month trend: compare last month vs month before
        if len(months) >= 2:
            last_month = months[-1]
            prev_month = months[-2]

            last_total = qs.filter(month_year=last_month).aggregate(
                total=Sum('count'))['total'] or 0
            prev_total = qs.filter(month_year=prev_month).aggregate(
                total=Sum('count'))['total'] or 0

            if prev_total > 0:
                one_month_change = round(
                    ((last_total - prev_total) / prev_total) * 100, 2
                )

    data = {
        'total_offences': total,
        'twelve_month_change_pct': twelve_month_change,
        'one_month_change_pct': one_month_change,
        'latest_month': latest_month,
        'earliest_month': earliest_month,
    }
    serializer = SummarySerializer(data)
    return Response(serializer.data)


@api_view(['GET'])
def boroughs(request):
    """Returns list of unique borough/area names."""
    area_type = request.query_params.get('area_type', '')
    qs = CrimeRecord.objects.all()
    if area_type:
        qs = qs.filter(area_type=area_type)
    names = sorted(
        qs.values_list('area_name', flat=True).distinct()
    )
    return Response(names)


@api_view(['GET'])
def area_types(request):
    """Returns list of unique area types."""
    types = sorted(
        CrimeRecord.objects.values_list('area_type', flat=True).distinct()
    )
    return Response(types)


@api_view(['GET'])
def offence_groups(request):
    """Returns list of unique offence groups."""
    groups = sorted(
        CrimeRecord.objects
        .exclude(offence_group='Nfib Fraud')
        .values_list('offence_group', flat=True)
        .distinct()
    )
    return Response(groups)


@api_view(['GET'])
def offence_subgroups(request):
    """Returns list of unique offence subgroups, optionally filtered by group."""
    qs = CrimeRecord.objects.all()
    group = request.query_params.get('offence_group')
    if group:
        qs = qs.filter(offence_group=group)
    subgroups = sorted(
        qs.values_list('offence_subgroup', flat=True).distinct()
    )
    return Response(subgroups)


@api_view(['GET'])
def date_range(request):
    """Returns the min and max month_year values in the data."""
    months = sorted(
        CrimeRecord.objects.values_list('month_year', flat=True).distinct()
    )
    return Response({
        'months': months,
        'earliest': months[0] if months else '',
        'latest': months[-1] if months else '',
    })


@api_view(['GET'])
def borough_totals(request):
    """
    Returns aggregated crime counts per borough/area for map shading.
    """
    qs = _apply_filters(CrimeRecord.objects.all(), request)

    totals = (
        qs.values('area_name')
        .annotate(total_count=Sum('count'))
        .order_by('-total_count')
    )

    serializer = BoroughTotalSerializer(totals, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def time_series(request):
    """
    Returns monthly aggregated offence counts for line chart.
    """
    qs = _apply_filters(CrimeRecord.objects.all(), request)

    series = (
        qs.values('month_year')
        .annotate(total_count=Sum('count'))
        .order_by('month_year')
    )

    serializer = TimeSeriesSerializer(series, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def offence_breakdown(request):
    """
    Returns offence counts grouped by offence_group OR offence_subgroup.
    If 'offence_group' is filtered, we break down by subgroup.
    Otherwise, we break down by group.
    """
    qs = _apply_filters(CrimeRecord.objects.all(), request)
    
    # Check if we are filtering by a specific group
    group_filter = request.query_params.get('offence_group')
    
    if group_filter:
        # Breakdown by subgroup
        breakdown = (
            qs.values('offence_subgroup')
            .annotate(total_count=Sum('count'))
            .order_by('-total_count')
        )
        # Rename key for serializer
        data = [
            {'label': item['offence_subgroup'], 'total_count': item['total_count']}
            for item in breakdown
        ]
    else:
        # Breakdown by group
        breakdown = (
            qs.values('offence_group')
            .annotate(total_count=Sum('count'))
            .order_by('-total_count')
        )
        # Rename key for serializer
        data = [
            {'label': item['offence_group'], 'total_count': item['total_count']}
            for item in breakdown
        ]

    serializer = OffenceBreakdownSerializer(data, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def borough_ranking(request):
    """
    Given a postcode and optionally an offence_group, return:
      - The matched borough
      - Its rank among all boroughs for that crime type (most recent 12 months)
      - A full ranked list for charting
    If offence_group is empty or 'OVERALL', ranks by total crime across all types.
    """
    from .postcode_mapping import lookup_borough

    postcode = request.query_params.get('postcode', '').strip()
    offence_group = request.query_params.get('offence_group', '').strip()

    if not postcode:
        return Response({'error': 'Please provide a postcode.'}, status=400)

    borough = lookup_borough(postcode)
    if not borough:
        return Response(
            {'error': 'That postcode was not recognised as a London postcode. '
                       'Please enter a valid London postcode (e.g. E1 6AN).'},
            status=400
        )

    # Use the most recent 12 months of data
    months = sorted(
        CrimeRecord.objects.values_list('month_year', flat=True).distinct()
    )
    recent_months = months[-12:] if len(months) >= 12 else months

    # Base filter
    base_filter = {
        'area_type': 'Borough',
        'month_year__in': recent_months,
    }

    # If a specific offence group is selected (not "OVERALL"), filter by it
    is_overall = (not offence_group or offence_group == 'OVERALL')
    if not is_overall:
        base_filter['offence_group'] = offence_group

    # Aggregate by borough, excluding Other / NK and Unknown
    qs = (
        CrimeRecord.objects
        .filter(**base_filter)
        .exclude(area_name__in=['Other / NK', 'Unknown'])
        .values('area_name')
        .annotate(total_count=Sum('count'))
        .order_by('-total_count')
    )

    ranked = list(qs)
    total_boroughs = len(ranked)

    # Find the user's borough rank
    user_rank = None
    user_count = 0
    for i, item in enumerate(ranked, start=1):
        item['is_user_borough'] = (item['area_name'] == borough)
        if item['area_name'] == borough:
            user_rank = i
            user_count = item['total_count']

    display_group = 'Overall' if is_overall else offence_group

    if user_rank is None:
        return Response(
            {'error': f'No crime data found for {borough} in the category "{display_group}".'},
            status=404
        )

    return Response({
        'borough': borough,
        'rank': user_rank,
        'total_boroughs': total_boroughs,
        'borough_count': user_count,
        'offence_group': display_group,
        'period': f'{recent_months[0]} to {recent_months[-1]}',
        'all_boroughs': ranked,
    })

