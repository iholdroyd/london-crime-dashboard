import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import KPICards from '../components/KPICards';
import BoroughMap from '../components/BoroughMap';
import OffenceBarChart from '../components/OffenceBarChart';
import {
    fetchSummary, fetchBoroughs, fetchDateRange,
    fetchBoroughTotals,
    fetchOffenceBreakdown,
    fetchOffenceGroups, fetchOffenceSubgroups
} from '../api/crimeApi';

export default function OverviewPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({});

    // Filter Options
    const [months, setMonths] = useState([]);
    const [boroughsList, setBoroughsList] = useState([]);
    const [offenceGroups, setOffenceGroups] = useState([]);

    // Data State
    const [summary, setSummary] = useState(null);
    const [boroughTotals, setBoroughTotals] = useState([]); // For Map (Global Context)
    const [offenceBreakdown, setOffenceBreakdown] = useState([]);

    const [loading, setLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        Promise.all([
            fetchDateRange(),
            fetchBoroughs({ area_type: 'Borough' }), // Filter for Boroughs only
            fetchOffenceGroups()
        ])
            .then(([dr, boroughs, groups]) => {
                const sortedMonths = (dr.months || []).sort().reverse(); // Latest to Earliest
                setMonths(sortedMonths);
                const filteredBoroughs = (boroughs || []).filter(b => {
                    const lower = b.toLowerCase();
                    return !lower.includes('other') && !lower.includes('unknown') && lower !== 'nk';
                });
                setBoroughsList(filteredBoroughs);
                const filteredGroups = (groups || []).filter(g => {
                    const lower = g.toLowerCase();
                    return !lower.includes('other') && !lower.includes('unknown') && lower !== 'nk';
                });
                setOffenceGroups(filteredGroups);

                // Set default start date to LATEST (which is now index 0)
                if (sortedMonths.length > 0) {
                    setFilters(prev => ({ ...prev, start_date: sortedMonths[0] }));
                }
            })
            .catch(err => console.error('Failed to load filter options:', err));
    }, []);

    // Load Data
    useEffect(() => {
        setLoading(true);
        const params = { ...filters };
        // Clean params
        Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

        // Map Context Params: Exclude borough filter to keep all boroughs colored
        const mapParams = { ...params };
        delete mapParams.borough;

        Promise.all([
            fetchSummary(params),
            fetchBoroughTotals(mapParams), // Use global context for map
            fetchOffenceBreakdown(params)
        ])
            .then(([sum, bt, ob]) => {
                setSummary(sum);
                setBoroughTotals(bt);
                setOffenceBreakdown(ob);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load data:', err);
                setLoading(false);
            });
    }, [filters]);

    const handleOffenceClick = useCallback(async (label) => {
        // Hardcoded exclusions
        const EXCLUDED_GROUPS = [
            'FRAUD AND FORGERY',
            'MISCELLANEOUS CRIMES AGAINST SOCIETY',
            'NFIB FRAUD',
            'POSSESSION OF WEAPONS'
        ];

        if (EXCLUDED_GROUPS.includes(label)) {
            return;
        }

        // Only drill down if we are at the top level
        if (!filters.offence_group) {
            try {
                // Check if meaningful subtypes exist
                const subtypes = await fetchOffenceSubgroups({ offence_group: label });

                // If no subtypes, or only 1 subtype that is identical to the group name, don't drill down
                if (!subtypes || subtypes.length === 0) return;
                if (subtypes.length === 1 && subtypes[0] === label) return;

                setFilters(prev => ({ ...prev, offence_group: label }));
            } catch (error) {
                console.error("Failed to check subtypes", error);
            }
        }
    }, [filters.offence_group]);

    const handleTrendClick = useCallback((trendType) => {
        // Navigate to trends page with current filter context
        const params = new URLSearchParams();
        if (filters.start_date) params.set('date', filters.start_date);
        if (filters.borough) params.set('borough', filters.borough);
        if (filters.offence_group) params.set('offence_group', filters.offence_group);
        params.set('trend', trendType);
        navigate(`/trends?${params.toString()}`);
    }, [filters, navigate]);

    return (
        <div className="overview-page">
            <FilterBar
                months={months}
                boroughs={boroughsList}
                offenceGroups={offenceGroups}
                filters={filters}
                onFilterChange={setFilters}
                showEndDate={false}
            />

            <KPICards summary={summary} loading={loading} onTrendClick={handleTrendClick} />

            <div className="chart-grid">
                <BoroughMap
                    boroughTotals={boroughTotals}
                    selectedBorough={filters.borough}
                    loading={loading}
                    onBoroughClick={(b) => setFilters(prev => {
                        // Toggle borough
                        if (prev.borough === b) {
                            const next = { ...prev };
                            delete next.borough;
                            return next;
                        }
                        return { ...prev, borough: b };
                    })}
                />
                <OffenceBarChart
                    data={offenceBreakdown}
                    loading={loading}
                    onBarClick={handleOffenceClick}
                    isDrilledDown={!!filters.offence_group}
                    onDrillUp={() => setFilters(prev => {
                        const next = { ...prev };
                        delete next.offence_group;
                        return next;
                    })}
                />
            </div>
        </div>
    );
}
