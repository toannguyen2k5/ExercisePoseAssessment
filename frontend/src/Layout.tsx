import { NavLink, Outlet, useLocation } from 'react-router-dom';
import StatusBar from './components/layout/StatusBar';

const NAV = [
  { to: '/',        icon: '◎',  label: 'Dashboard' },
  { to: '/eda',     icon: '⬡',  label: 'Dataset EDA' },
  { to: '/model',   icon: '⬢',  label: 'Model' },
  { to: '/upload',  icon: '⬆',  label: 'Upload Video' },
  { to: '/webcam',  icon: '◉',  label: 'Live Webcam' },
];

export default function Layout() {
  const location = useLocation();
  return (
    <>
      <div className="app-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="app-layout">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🏋</div>
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-title">PoseAssess</span>
              <span className="sidebar-logo-sub">Exercise AI</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <span className="nav-label">Menu</span>
            {NAV.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  'nav-item' + (isActive ? ' active' : '')
                }
              >
                <span className="nav-icon">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <StatusBar />
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}

