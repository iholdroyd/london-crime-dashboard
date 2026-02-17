import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function OffenceBarChart({ data, loading, onBarClick, isDrilledDown, onDrillUp }) {
    // If no data and not loading, show empty state
    if (!loading && (!data || data.length === 0)) {
        return (
            <div className="chart-card">
                <div className="chart-title">Offence Breakdown</div>
                <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>No data available</div>
            </div>
        );
    }

    // Sort by count descending, filter < 1, take top 15
    const sorted = data ? [...data]
        .filter(d => d.total_count >= 1)
        .sort((a, b) => b.total_count - a.total_count)
        .slice(0, 15)
        .map(d => ({
            ...d,
            // Use full label 
            display_label: d.label
        })) : [];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: '#111827',
                    border: '1px solid #2a3652',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#e8ecf2',
                    maxWidth: 300,
                }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.85rem' }}>
                        {payload[0].payload.label}
                    </div>
                    <div style={{ color: '#00a3e0' }}>
                        {payload[0].value.toLocaleString('en-GB')} offences
                    </div>
                    {!isDrilledDown && (
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 4 }}>
                            Click to see subtypes
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card" style={{ position: 'relative' }}>
            {/* Loading Overlay */}
            {loading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.5)', zIndex: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {/* Optional: <div className="loading-spinner" /> or just keep it subtle */}
                </div>
            )}

            <div className="chart-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{isDrilledDown ? 'Offence Subtypes' : 'Offences by Group'}</span>
                {isDrilledDown && (
                    <button
                        onClick={onDrillUp}
                        style={{
                            padding: '4px 12px',
                            fontSize: '0.8rem',
                            background: '#e2e8f0',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        ← Back to Groups
                    </button>
                )}
            </div>
            <ResponsiveContainer width="100%" height={Math.max(400, sorted.length * 32)}>
                <BarChart
                    data={sorted}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis
                        type="number"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    />
                    <YAxis
                        type="category"
                        dataKey="display_label"
                        tick={{ fill: '#475569', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={250}
                        interval={0}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Bar
                        dataKey="total_count"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={24}
                        onClick={(data) => {
                            if (!isDrilledDown && onBarClick) {
                                onBarClick(data.label);
                            }
                        }}
                        style={{ cursor: isDrilledDown ? 'default' : 'pointer' }}
                    >
                        {sorted.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={isDrilledDown ? '#3b82f6' : '#1e40af'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
