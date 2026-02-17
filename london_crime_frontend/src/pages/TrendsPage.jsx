import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import TimeSeriesChart from '../components/TimeSeriesChart';
import {
    fetchDateRange, fetchBoroughs, fetchOffenceGroups, fetchTimeSeries
} from '../api/crimeApi';

export default function TrendsPage() {
    const [searchParams] = useSearchParams();

    const [months, setMonths] = useState([]);
    const [boroughsList, setBoroughsList] = useState([]);
    const [offenceGroups, setOffenceGroups] = useState([]);

    const [filters, setFilters] = useState({});
    const [timeSeries, setTimeSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    // Initial load — fetch filter options, then set defaults from URL or fallback
    useEffect(() => {
        Promise.all([
            fetchDateRange(),
            fetchBoroughs({ area_type: 'Borough' }),
            fetchOffenceGroups()
        ])
            .then(([dr, boroughs, groups]) => {
                const sortedMonths = (dr.months || []).sort().reverse(); // Latest first
                setMonths(sortedMonths);
                setBoroughsList(boroughs || []);
                setOffenceGroups(groups || []);

                // Build initial filters from URL params or defaults
                const urlDate = searchParams.get('date');
                const urlBorough = searchParams.get('borough');
                const urlOffence = searchParams.get('offence_group');
                const urlTrend = searchParams.get('trend');

                const initial = {};

                // End date = the selected month (or latest)
                const endMonth = urlDate && sortedMonths.includes(urlDate) ? urlDate : sortedMonths[0];
                initial.start_date = endMonth;

                // Start date = 12 months before end date (or based on trend type)
                if (urlTrend === '1-month') {
                    // 1-month trend: show last 2 months range
                    const endIdx = sortedMonths.indexOf(endMonth);
                    const startIdx = Math.min(endIdx + 1, sortedMonths.length - 1);
                    initial.end_date = sortedMonths[startIdx];
                } else {
                    // Default: 12 months
                    const endIdx = sortedMonths.indexOf(endMonth);
                    const startIdx = Math.min(endIdx + 11, sortedMonths.length - 1);
                    initial.end_date = sortedMonths[startIdx];
                }

                // Swap so start_date < end_date for the API
                if (initial.start_date > initial.end_date) {
                    [initial.start_date, initial.end_date] = [initial.end_date, initial.start_date];
                }

                if (urlBorough) initial.borough = urlBorough;
                if (urlOffence) initial.offence_group = urlOffence;

                setFilters(initial);
                setInitialized(true);
            })
            .catch(err => console.error('Failed to load filter options:', err));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Load time series data when filters change
    useEffect(() => {
        if (!initialized) return;

        setLoading(true);
        const params = { ...filters };
        Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

        fetchTimeSeries(params)
            .then(ts => {
                setTimeSeries(ts);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load time series:', err);
                setLoading(false);
            });
    }, [filters, initialized]);

    return (
        <div className="overview-page">
            <div className="dashboard-header" style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    How are Crime Rates Changing?
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '4px' }}>
                    See how crime reporting has changed over time. Adjust the date range, area, and crime type to focus your analysis.
                </p>
            </div>

            <FilterBar
                months={months}
                boroughs={boroughsList}
                offenceGroups={offenceGroups}
                filters={filters}
                onFilterChange={setFilters}
                showEndDate={true}
            />

            <TimeSeriesChart data={timeSeries} loading={loading} />
        </div>
    );
}
