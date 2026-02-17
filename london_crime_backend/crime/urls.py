from django.urls import path
from . import views

urlpatterns = [
    path('summary/', views.summary, name='summary'),
    path('boroughs/', views.boroughs, name='boroughs'),
    path('area-types/', views.area_types, name='area-types'),
    path('offence-groups/', views.offence_groups, name='offence-groups'),
    path('offence-subgroups/', views.offence_subgroups, name='offence-subgroups'),
    path('date-range/', views.date_range, name='date-range'),
    path('borough-totals/', views.borough_totals, name='borough-totals'),
    path('time-series/', views.time_series, name='time-series'),
    path('offence-breakdown/', views.offence_breakdown, name='offence-breakdown'),
    path('borough-ranking/', views.borough_ranking, name='borough-ranking'),
]
