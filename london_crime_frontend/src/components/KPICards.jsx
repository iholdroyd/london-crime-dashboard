import { formatMonthYear, getPreviousMonth, get12MonthsAgo } from '../utils/dateUtils';

export default function KPICards({ summary, loading, onTrendClick }) {
    if (loading) {
        return (
            <div className="kpi-grid">
                {[1, 2, 3].map(i => (
                    <div key={i} className="kpi-card">
                        <div className="loading">
                            <div className="loading-spinner" />
                            Loading...
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!summary) return null;

    const formatNumber = (num) => {
        if (num == null) return '—';
        return num.toLocaleString('en-GB');
    };

    const formatPct = (pct) => {
        if (pct == null) return '—';
        const abs = Math.abs(pct).toFixed(2);
        const arrow = pct < 0 ? '▼' : pct > 0 ? '▲' : '';
        return `${arrow} ${abs}%`;
    };

    const trendClass = (pct) => {
        if (pct == null) return 'neutral';
        // For crime stats, decrease is good (green), increase is bad (red)
        return pct < 0 ? 'down' : pct > 0 ? 'up' : 'neutral';
    };

    const trendCardStyle = onTrendClick ? { cursor: 'pointer' } : {};

    // Format reference month for humanized descriptions
    // For 1-month trend, show the previous month (e.g., Dec 2025 when viewing Jan 2026)
    const previousMonth = getPreviousMonth(summary.latest_month);
    // For 12-month trend, show the same month one year ago (e.g., Jan 2025 when viewing Jan 2026)
    const twelveMonthsAgo = get12MonthsAgo(summary.latest_month);

    const formatTrendDescription = (pct, months) => {
        if (pct == null) return '—';
        const abs = Math.abs(pct).toFixed(2);
        const direction = pct < 0 ? 'decreased' : pct > 0 ? 'increased' : 'stayed the same';
        const timeframe = months === 1 ? previousMonth : twelveMonthsAgo;
        return `Reports of crime have ${direction} by ${abs}% since ${timeframe}`;
    };

    return (
        <div className="kpi-grid">
            <div className="kpi-card">
                <div className="kpi-label">Times People Have Reported a Crime</div>
                <div className="kpi-value">{formatNumber(summary.total_offences)}</div>
                <div className="kpi-subtitle">
                    {formatMonthYear(summary.earliest_month)} — {formatMonthYear(summary.latest_month)}
                </div>
            </div>

            <div
                className="kpi-card"
                style={trendCardStyle}
                onClick={() => onTrendClick && onTrendClick('1-month')}
            >
                <div className="kpi-label">1-Month Trend</div>
                <div className="kpi-value" style={{ fontSize: '2rem' }}>
                    <span className={`kpi-trend ${trendClass(summary.one_month_change_pct)}`}>
                        {formatPct(summary.one_month_change_pct)}
                    </span>
                </div>
                <div className="kpi-subtitle">
                    {formatTrendDescription(summary.one_month_change_pct, 1)}
                </div>
            </div>

            <div
                className="kpi-card"
                style={trendCardStyle}
                onClick={() => onTrendClick && onTrendClick('12-month')}
            >
                <div className="kpi-label">12-Month Trend</div>
                <div className="kpi-value" style={{ fontSize: '2rem' }}>
                    <span className={`kpi-trend ${trendClass(summary.twelve_month_change_pct)}`}>
                        {formatPct(summary.twelve_month_change_pct)}
                    </span>
                </div>
                <div className="kpi-subtitle">
                    {formatTrendDescription(summary.twelve_month_change_pct, 12)}
                </div>
            </div>
        </div>
    );
}
