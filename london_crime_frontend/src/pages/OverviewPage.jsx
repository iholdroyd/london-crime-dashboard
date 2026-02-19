import { useState, useEffect, useCallback, useMemo } from 'react';
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

// --- Crime category definitions ---
const CRIME_CATEGORIES = [
    {
        label: 'Crimes Against People',
        groups: ['Violence Against The Person', 'Sexual Offences', 'Robbery', 'Theft']
    },
    {
        label: 'Property Crimes',
        groups: ['Burglary', 'Arson And Criminal Damage', 'Vehicle Offences']
    },
    {
        label: 'Drug & Weapon Offences',
        groups: ['Drug Offences', 'Possession Of Weapons']
    },
    {
        label: 'Public Order & Societal',
        groups: ['Public Order Offences', 'Miscellaneous Crimes Against Society', 'Fraud And Forgery']
    }
];

// Reverse lookup: group name -> category label
const GROUP_TO_CATEGORY = {};
CRIME_CATEGORIES.forEach(cat => {
    cat.groups.forEach(g => { GROUP_TO_CATEGORY[g] = cat.label; });
});

export default function OverviewPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({});

    // Drill-down state: 'category' | 'group' | 'subgroup'
    const [drillLevel, setDrillLevel] = useState('category');
    const [drillCategory, setDrillCategory] = useState(null); // which category we've drilled into
    const [drillGroup, setDrillGroup] = useState(null); // which offence_group we've drilled into

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

        // FIX: Force snapshot mode (single month) if start_date is present but end_date is missing
        if (params.start_date && !params.end_date) {
            params.end_date = params.start_date;
        }

        // Add offence_group to API params when drilled to group or subgroup level
        const dataParams = { ...params };
        if (drillGroup) {
            dataParams.offence_group = drillGroup;
        }

        // Map Context Params: Exclude borough filter to keep all boroughs colored
        const mapParams = { ...params };
        delete mapParams.borough;

        // Sync map with drill-down state
        if (drillGroup) {
            // Drilled into a specific group -> map shows that group only
            mapParams.offence_group = drillGroup;
        } else if (drillCategory) {
            // Drilled into a category -> map shows all groups in that category
            const cat = CRIME_CATEGORIES.find(c => c.label === drillCategory);
            if (cat) {
                mapParams.offence_groups = cat.groups.join(',');
            }
        }

        Promise.all([
            fetchSummary(params),
            fetchBoroughTotals(mapParams), // Use context-aware params for map
            fetchOffenceBreakdown(dataParams)
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
    }, [filters, drillGroup, drillCategory]);

    // Reset drill-down when offence group changes
    useEffect(() => {
        setDrillLevel('category');
        setDrillCategory(null);
        setDrillGroup(null);
    }, [filters.offence_group]);

    // Aggregate offence breakdown into 4 categories
    const categoryData = useMemo(() => {
        if (!offenceBreakdown || offenceBreakdown.length === 0) return [];

        return CRIME_CATEGORIES.map(cat => {
            const total = offenceBreakdown
                .filter(d => cat.groups.includes(d.label))
                .reduce((sum, d) => sum + d.total_count, 0);
            return { label: cat.label, total_count: total };
        }).filter(d => d.total_count > 0);
    }, [offenceBreakdown]);

    // Filter offence breakdown to show only groups within the selected category
    const groupDataForCategory = useMemo(() => {
        if (!drillCategory || !offenceBreakdown) return [];
        const cat = CRIME_CATEGORIES.find(c => c.label === drillCategory);
        if (!cat) return [];
        return offenceBreakdown.filter(d => cat.groups.includes(d.label));
    }, [drillCategory, offenceBreakdown]);

    // Determine what data to show in the bar chart
    const chartData = useMemo(() => {
        // If global filter is active, show the raw breakdown (subgroups)
        if (filters.offence_group) return offenceBreakdown;

        if (drillLevel === 'category') return categoryData;
        if (drillLevel === 'group') return groupDataForCategory;
        if (drillLevel === 'subgroup') return offenceBreakdown; // API already returns subgroups when offence_group is set
        return categoryData;
    }, [drillLevel, categoryData, groupDataForCategory, offenceBreakdown, filters.offence_group]);

    // Determine chart title
    const chartTitle = useMemo(() => {
        if (filters.offence_group) return filters.offence_group;
        if (drillLevel === 'category') return 'Crime by Category';
        if (drillLevel === 'group') return drillCategory || 'Offences by Group';
        if (drillLevel === 'subgroup') return drillGroup || 'Offence Subtypes';
        return 'Crime by Category';
    }, [drillLevel, drillCategory, drillGroup, filters.offence_group]);

    const handleBarClick = useCallback((label) => {
        if (drillLevel === 'category') {
            // Drill into category -> show constituent groups
            setDrillCategory(label);
            setDrillLevel('group');
        } else if (drillLevel === 'group') {
            // Drill into group -> show subgroups
            setDrillGroup(label);
            setDrillLevel('subgroup');
        }
        // At subgroup level, no further drill-down
    }, [drillLevel]);

    const handleDrillUp = useCallback(() => {
        if (drillLevel === 'subgroup') {
            setDrillGroup(null);
            setDrillLevel('group');
        } else if (drillLevel === 'group') {
            setDrillCategory(null);
            setDrillLevel('category');
        }
    }, [drillLevel]);

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
                    category={drillCategory}
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
                    data={chartData}
                    loading={loading}
                    onBarClick={handleBarClick}
                    isDrilledDown={drillLevel !== 'category'}
                    drillLevel={drillLevel}
                    chartTitle={chartTitle}
                    onDrillUp={handleDrillUp}
                />
            </div>
        </div>
    );
}

