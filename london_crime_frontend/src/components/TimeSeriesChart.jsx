import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatMonthYear } from '../utils/dateUtils';

export default function TimeSeriesChart({ data, loading }) {
    if (!loading && (!data || data.length === 0)) {
        return (
            <div className="chart-card full-width">
                <div className="chart-title">Monthly Crime Volume Over Time</div>
                <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>No data available</div>
            </div>
        );
    }

    // Format month labels to "Month Year"
    const formatted = data ? data.map(d => ({
        ...d,
        label: formatMonthYear(d.month_year),
    })) : [];

    // Shorter labels for x-axis ticks (e.g. "Jan 2026")
    const shortLabel = (raw) => {
        if (!raw || typeof raw !== 'string') return raw;
        const parts = raw.split(' ');
        if (parts.length < 2) return raw;
        return parts[0].substring(0, 3) + ' ' + parts[1];
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: '#111827',
                    border: '1px solid #2a3652',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#e8ecf2',
                }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                    <div style={{ color: '#00a3e0' }}>
                        Offences: {payload[0].value.toLocaleString('en-GB')}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Calculate y-axis domain to make data cover ~2/3 of vertical range
    const getYAxisDomain = () => {
        if (!formatted || formatted.length === 0) return ['auto', 'auto'];

        const values = formatted.map(d => d.total_count);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue;

        // Set the y-axis min so that the data range occupies ~2/3 of the chart
        // This means the bottom 1/3 is padding below the minimum data value
        const paddingFactor = 0.5; // data range / total chart range = 2/3, so padding below = range * 0.5
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

            <div className="chart-title">Number of Times People Have Reported a Crime Over Time</div>
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
                    <Line
                        type="monotone"
                        dataKey="total_count"
                        stroke="#00a3e0"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, fill: '#00a3e0', stroke: '#0a0f1c', strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
