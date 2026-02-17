import { useState, useEffect, useCallback } from 'react';
import FilterBar from '../components/FilterBar';
import KPICards from '../components/KPICards';
import BoroughMap from '../components/BoroughMap';
import TimeSeriesChart from '../components/TimeSeriesChart';
import {
    fetchSummary, fetchBoroughs, fetchDateRange,
    fetchBoroughTotals, fetchTimeSeries
} from '../api/crimeApi';

export default function CategoryPage({ title, filter }) {
    const [filters, setFilters] = useState({});
    const [months, setMonths] = useState([]);
    const [boroughsList, setBoroughsList] = useState([]);

    const [summary, setSummary] = useState(null);
    const [boroughTotals, setBoroughTotals] = useState([]);
    const [timeSeries, setTimeSeries] = useState([]);

    const [loading, setLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        Promise.all([fetchDateRange(), fetchBoroughs()])
            .then(([dr, boroughs]) => {
                setMonths(dr.months || []);
                setBoroughsList(boroughs || []);
            })
            .catch(err => console.error('Failed to load filter options:', err));
    }, []);

    // Load Data
    useEffect(() => {
        setLoading(true);
        const params = { ...filters, ...filter }; // Merge page-specific filter

        // Clean params
        Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

        Promise.all([
            fetchSummary(params),
            fetchBoroughTotals(params),
            fetchTimeSeries(params)
        ])
            .then(([sum, bt, ts]) => {
                setSummary(sum);
                setBoroughTotals(bt);
                setTimeSeries(ts);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load data:', err);
                setLoading(false);
            });
    }, [filters, filter]);

    return (
        <div className="category-page">
            <div className="dashboard-header">
                <h1>{title}</h1>
            </div>

            <FilterBar
                months={months}
                boroughs={boroughsList}
                offenceGroups={[]} // No offence group filter on category pages usually? Or maybe yes.
                filters={filters}
                onFilterChange={setFilters}
            />

            <KPICards summary={summary} loading={loading} />

            <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <BoroughMap
                    boroughTotals={boroughTotals}
                    loading={loading}
                    onBoroughClick={(b) => setFilters(prev => ({ ...prev, borough: b }))}
                />
                <TimeSeriesChart data={timeSeries} loading={loading} />
            </div>
        </div>
    );
}
