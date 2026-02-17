import { useNavigate } from 'react-router-dom';

const links = [
    {
        path: '/overview',
        title: 'Monthly Snapshot',
        desc: 'View the latest monthly crime data across all London boroughs with interactive maps and charts.',
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
            </svg>
        ),
    },
    {
        path: '/crime-in-your-area',
        title: 'Crime in Your Area',
        desc: 'Enter your postcode to see how your borough compares to others for specific crime types.',
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
            </svg>
        ),
    },
    {
        path: '/trends',
        title: 'How are Crime Rates Changing',
        desc: 'Explore how crime volumes have changed over time with customisable date ranges and filters.',
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
        ),
    },
];

export default function Coversheet() {
    const navigate = useNavigate();

    return (
        <div className="coversheet">
            <div className="coversheet-hero">
                <h2>Crime in London</h2>
                <p>
                    Londoners are feeling less safe, but the reality behind crime is often unclear.
                </p>
                <p>
                    This interactive dashboard visualises the latest crimes reported to the Metropolitan Police.
                </p>
                <p>
                    Explore and filter trends across all London boroughs to see the impact of crime in your area.
                </p>
                <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#94a3b8' }}>
                    Most recent data release by the Met Police was on <strong>January 2026</strong>.
                </p>
            </div>

            <div className="coversheet-links">
                {links.map(l => (
                    <div
                        key={l.path}
                        className="coversheet-link"
                        onClick={() => navigate(l.path)}
                    >
                        <div className="coversheet-link-icon">{l.icon}</div>
                        <h3>{l.title}</h3>
                        <p>{l.desc}</p>
                        <span className="coversheet-link-arrow">→</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
