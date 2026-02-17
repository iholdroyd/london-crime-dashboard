import { NavLink } from 'react-router-dom';

const tabs = [
    { path: '/', label: 'Home' },
    { path: '/overview', label: 'Monthly Snapshot' },
    { path: '/crime-in-your-area', label: 'Crime in Your Area' },
    { path: '/trends', label: 'How are Crime Rates Changing' },
];

export default function Header() {
    return (
        <header className="header">
            <div className="header-top">
                <div className="header-title">
                    <h1>Crime in London</h1>
                    <span className="header-badge">Dashboard</span>
                </div>
            </div>
            <nav className="nav-tabs">
                {tabs.map(t => (
                    <NavLink
                        key={t.path}
                        to={t.path}
                        end={t.path === '/'}
                        className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
                    >
                        {t.label}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
}
