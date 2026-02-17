import { useState, useEffect } from 'react';
import { fetchOffenceGroups, fetchBoroughRanking } from '../api/crimeApi';
import { formatMonthYear } from '../utils/dateUtils';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function CrimeInYourAreaPage() {
    const [offenceGroups, setOffenceGroups] = useState([]);
    const [postcode, setPostcode] = useState('');
    const [selectedCrime, setSelectedCrime] = useState('OVERALL');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOffenceGroups()
            .then(groups => {
                const excluded = ['NFIB FRAUD'];
                const filtered = (groups || []).filter(g => {
                    if (excluded.includes(g)) return false;
                    const lower = g.toLowerCase();
                    if (lower.includes('other') || lower.includes('unknown') || lower === 'nk') return false;
                    return true;
                });
                setOffenceGroups(filtered);
            })
            .catch(err => console.error('Failed to load offence groups:', err));
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!postcode.trim() || !selectedCrime) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await fetchBoroughRanking({
                postcode: postcode.trim(),
                offence_group: selectedCrime,
            });
            setResult(data);
        } catch (err) {
            const msg = err.response?.data?.error
                || 'Something went wrong. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Chart data — largest to smallest (top to bottom), already sorted from backend
    const chartData = result
        ? result.all_boroughs
        : [];

    // Ordinal suffix
    const ordinal = (n) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // Color for rank: dark red (#b91c1c) for rank 1 → light green (#22c55e) for last rank
    const rankColor = (rank, total) => {
        if (total <= 1) return '#64748b';
        const t = (rank - 1) / (total - 1); // 0 = rank 1 (worst), 1 = last rank (best)
        // Interpolate HSL: hue from 0 (red) to 130 (green), saturation 70%, lightness 40-45%
        const hue = Math.round(t * 130);
        const lightness = Math.round(38 + t * 10); // 38% → 48%
        return `hsl(${hue}, 72%, ${lightness}%)`;
    };

    // Format crime type for display (title case)
    const formatCrimeType = (str) =>
        str === 'Overall'
            ? 'Overall Crime'
            : str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

    return (
        <div className="area-page">
            <div className="area-hero">
                <h2>Crime in Your Area</h2>
                <p>Enter your London postcode and select a crime type to see how your borough compares.</p>
            </div>

            <form className="area-search-form" onSubmit={handleSearch}>
                <div className="area-input-group">
                    <label htmlFor="postcode-input">Your Postcode</label>
                    <input
                        id="postcode-input"
                        type="text"
                        placeholder="e.g. SW1A 2AA, SW9 9BD"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        className="area-input"
                    />
                </div>

                <div className="area-input-group">
                    <label htmlFor="crime-select">Crime Type</label>
                    <select
                        id="crime-select"
                        value={selectedCrime}
                        onChange={(e) => setSelectedCrime(e.target.value)}
                        className="area-select"
                    >
                        <option value="OVERALL">Overall (All Crime Types)</option>
                        {offenceGroups.map(g => (
                            <option key={g} value={g}>
                                {formatCrimeType(g)}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    className="area-search-btn"
                    disabled={loading || !postcode.trim() || !selectedCrime}
                >
                    {loading ? (
                        <>
                            <span className="loading-spinner-sm"></span>
                            Searching…
                        </>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            Search
                        </>
                    )}
                </button>
            </form>

            {error && (
                <div className="area-error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {error}
                </div>
            )}

            {result && (
                <div className="area-results">
                    <div className="area-rank-card">
                        <div className="area-rank-badge">
                            <span
                                className="area-rank-number"
                                style={{ color: rankColor(result.rank, result.total_boroughs) }}
                            >
                                {ordinal(result.rank)}
                            </span>
                            <span className="area-rank-total">out of {result.total_boroughs}</span>
                        </div>
                        <div className="area-rank-info">
                            <h3>{result.borough}</h3>
                            <p>
                                ranks <strong style={{ color: rankColor(result.rank, result.total_boroughs) }}>{ordinal(result.rank)}</strong> highest out of{' '}
                                <strong>{result.total_boroughs}</strong> London boroughs for{' '}
                                <strong>{formatCrimeType(result.offence_group)}</strong>
                            </p>
                            <span className="area-rank-detail">
                                {result.borough_count.toLocaleString()} reported offences
                                <span className="area-rank-period"> · {result.period.split(' to ').map(d => formatMonthYear(d)).join(' to ')}</span>
                            </span>
                        </div>
                    </div>

                    <div className="chart-card area-chart-card">
                        <h3 className="chart-title">
                            {formatCrimeType(result.offence_group)} — All Boroughs Ranked
                        </h3>
                        <div style={{ width: '100%', height: Math.max(600, chartData.length * 26) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                >
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickFormatter={(v) => v.toLocaleString()}
                                    />
                                    <YAxis
                                        dataKey="area_name"
                                        type="category"
                                        width={180}
                                        tick={{ fontSize: 12, fill: '#334155' }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [value.toLocaleString(), 'Offences']}
                                        contentStyle={{
                                            background: '#fff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        }}
                                    />
                                    <Bar dataKey="total_count" radius={[0, 4, 4, 0]}>
                                        {chartData.map((entry) => (
                                            <Cell
                                                key={entry.area_name}
                                                fill={entry.is_user_borough ? '#2563eb' : '#cbd5e1'}
                                                stroke={entry.is_user_borough ? '#1d4ed8' : 'none'}
                                                strokeWidth={entry.is_user_borough ? 2 : 0}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="area-chart-legend">
                            <span className="area-legend-item">
                                <span className="area-legend-swatch" style={{ background: '#2563eb' }}></span>
                                Your borough ({result.borough})
                            </span>
                            <span className="area-legend-item">
                                <span className="area-legend-swatch" style={{ background: '#cbd5e1' }}></span>
                                Other boroughs
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
