import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useProject } from './hooks/useApi';
import Overview from './views/Overview';
import LogViewer from './views/LogViewer';
import Journal from './views/Journal';
import DiffPlayback from './views/DiffPlayback';
import DagView from './views/DagView';
import Blueprint from './views/Blueprint';
import { ProjectSwitcher } from './components/ProjectSwitcher';
import { NAV_ITEMS } from './components/NavIcons';
// Vite's resolveJsonModule (enabled by default) lets us import the
// version from package.json so the badge stays in sync with releases
// without manual updates. If you move package.json or the build setup
// changes, adjust this import path.
import { version as APP_VERSION } from '../../package.json';

function ConnectionBanner({ isError }: { isError: boolean }) {
  if (!isError) return null;
  return (
    <div className="conn-banner">
      ⚠ Cannot reach server — check that <code>archon dashboard &lt;project&gt;</code> is
      running and you're on the correct port
    </div>
  );
}

/**
 * Desktop / wide top navigation — text links. Hidden on phones (≤640px) via
 * CSS, where the bottom tab bar takes over.
 */
function TopNav() {
  return (
    <nav className="header-nav">
      {NAV_ITEMS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Mobile bottom tab bar — icon + short label, thumb-reachable, with safe-area
 * padding for the iOS home indicator. Always in the DOM; CSS shows it only on
 * phone-width viewports so there's no layout shift on resize.
 */
function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map(({ to, label, end, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}
        >
          <Icon className="bottom-tab-icon" />
          <span className="bottom-tab-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  const { data: project, isError } = useProject();
  return (
    <div className="app">
      <ConnectionBanner isError={isError} />
      <header className="header">
        <h1>Archon</h1>
        <span className="version-badge" title={`Archon dashboard v${APP_VERSION}`}>
          v{APP_VERSION}
        </span>
        {project && <span className="project-badge" title={project.path}>{project.name}</span>}
        <ProjectSwitcher />
        <TopNav />
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Overview />} />
          {/* The old proof-graph view is superseded by the DAG. */}
          <Route path="/graph" element={<Navigate to="/dag" replace />} />
          <Route path="/dag" element={<DagView />} />
          <Route path="/blueprint" element={<Blueprint />} />
          <Route path="/logs" element={<LogViewer />} />
          <Route path="/diffs" element={<DiffPlayback />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
