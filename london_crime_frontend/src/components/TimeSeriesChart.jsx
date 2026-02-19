import { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatMonthYear } from '../utils/dateUtils';

export default function TimeSeriesChart({ data, londonAverage, loading, chartTitle, showLondonAverage, boroughName }) {
    if (!loading && (!data || data.length === 0)) {
        return (
            <div className="chart-card full-width">
                <div className="chart-title">{chartTitle || 'Monthly Crime Volume Over Time'}</div>
                <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>No data available</div>
            </div>
        );
    }

    // Merge borough data with London average data
    const formatted = useMemo(() => {
        if (!data) return [];

        // Build a lookup of London average by month
        const avgByMonth = {};
        if (showLondonAverage && londonAverage && londonAverage.length > 0) {
            // Count how many boroughs contribute to get a per-borough average
            // The API returns total for all boroughs, so we divide by ~32 boroughs
            const BOROUGH_COUNT = 32;
            londonAverage.forEach(d => {
                avgByMonth[d.month_year] = Math.round(d.total_count / BOROUGH_COUNT);
            });
        }

        return data.map(d => ({
            ...d,
            label: formatMonthYear(d.month_year),
            london_avg: avgByMonth[d.month_year] ?? null,
        }));
    }, [data, londonAverage, showLondonAverage]);

    // Shorter labels for x-axis ticks (e.g. "Jan 2026")
    const shortLabel = (raw) => {
        if (!raw || typeof raw !== 'string') return raw;
        const parts = raw.split(' ');
        if (parts.length < 2) return raw;
        return parts[0].substring(0, 3) + ' ' + parts[1];
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            // Find borough and average entries
            const boroughEntry = payload.find(p => p.dataKey === 'total_count');
            const avgEntry = payload.find(p => p.dataKey === 'london_avg');

            return (
                <div style={{
                    background: '#111827',
                    border: '1px solid #2a3652',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#e8ecf2',
                }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                    {boroughEntry && (
                        <div style={{ color: '#00a3e0' }}>
                            {boroughName || 'Offences'}: {boroughEntry.value.toLocaleString('en-GB')}
                        </div>
                    )}
                    {avgEntry && avgEntry.value != null && (
                        <div style={{ color: '#9ca3af', marginTop: 2 }}>
                            London Average: {avgEntry.value.toLocaleString('en-GB')}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    // Calculate y-axis domain to make data cover ~2/3 of vertical range
    const getYAxisDomain = () => {
        if (!formatted || formatted.length === 0) return ['auto', 'auto'];

        const values = formatted.map(d => d.total_count);
        if (showLondonAverage) {
            formatted.forEach(d => {
                if (d.london_avg != null) values.push(d.london_avg);
            });
        }
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue;

        // Set the y-axis min so that the data range occupies ~2/3 of the chart
        const paddingFactor = 0.5;
        const yMin = Math.max(0, minValue - (range * paddingFactor));

        return [Math.floor(yMin), 'auto'];
    };

    return (
        <div className="chart-card full-width" style={{ position: 'relative' }}>
            {/* Loading Overlay */}
            {loading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.5)', zIndex: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {/* <div className="loading-spinner" /> */}
                </div>
            )}

            <div className="chart-title">{chartTitle || 'Number of Times People Have Reported a Crime Over Time'}</div>
            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={formatted} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                        dataKey="label"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        interval="preserveStartEnd"
                        tickLine={false}
                        tickFormatter={shortLabel}
                    />
                    <YAxis
                        domain={getYAxisDomain()}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {/* London Average line (behind, rendered first) */}
                    {showLondonAverage && (
                        <Line
                            type="monotone"
                            dataKey="london_avg"
                            stroke="#9ca3af"
                            strokeWidth={1.5}
                            strokeDasharray="6 3"
                            dot={false}
                            activeDot={{ r: 4, fill: '#9ca3af', stroke: '#0a0f1c', strokeWidth: 1 }}
                            name="London Average"
                        />
                    )}

                    {/* Main borough line */}
                    <Line
                        type="monotone"
                        dataKey="total_count"
                        stroke="#00a3e0"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, fill: '#00a3e0', stroke: '#0a0f1c', strokeWidth: 2 }}
                        name={boroughName || 'Offences'}
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Legend when showing London average */}
            {showLondonAverage && (
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: '24px',
                    marginTop: '8px', fontSize: '0.8rem', color: '#64748b'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 20, height: 2, background: '#00a3e0' }} />
                        <span>{boroughName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 20, height: 2, background: '#9ca3af', borderTop: '1px dashed #9ca3af' }} />
                        <span>London Average</span>
                    </div>
                </div>
            )}
        </div>
    );
}
