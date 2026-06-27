import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useProject, useScope } from './hooks/useApi';
import { useTheme } from './hooks/useTheme';
import Overview from './views/Overview';
import LogViewer from './views/LogViewer';
import Journal from './views/Journal';
import DiffPlayback from './views/DiffPlayback';
import DagView from './views/DagView';
import Blueprint from './views/Blueprint';
import CodeView from './views/CodeView';
import ScopeHome from './views/ScopeHome';
import { ProjectSwitcher } from './components/ProjectSwitcher';
import { isStaticDashboard } from './lib/staticMode';
import { getProjectScope, isStaticScope } from './lib/projectScope';
import { NAV_ITEMS } from './components/NavIcons';
// Vite's resolveJsonModule (enabled by default) lets us import the
// version from package.json so the badge stays in sync with releases
// without manual updates. If you move package.json or the build setup
// changes, adjust this import path.
import { version as APP_VERSION } from '../../package.json';

function ConnectionBanner({ isError }: { isError: boolean }) {
  if (isStaticDashboard()) return null;
  if (!isError) return null;
  return (
    <div className="conn-banner">
      ⚠ Cannot reach server — check that <code>archon dashboard &lt;project&gt;</code> is
      running and you're on the correct port
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? '☀' : '☾'}
    </button>
  );
}

/**
 * Mobile bottom tab bar — icon + short label, thumb-reachable, with safe-area
 * padding for the iOS home indicator. Always in the DOM; CSS shows it only on
 * phone-width viewports so there's no layout shift on resize. Uses the core
 * NAV_ITEMS; the richer desktop nav (Scope Home / Code / static toggles) lives
 * inline in the header and is hidden on phones via CSS.
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
  const { data: scope } = useScope();
  const isStatic = isStaticDashboard();
  const staticScope = isStaticScope();
  const inScopeMode = !!scope?.inScope;
  const showScopeHome = inScopeMode;
  const showCode = isStatic;
  const projectScope = getProjectScope();
  // In live mode the project switcher always shows. In static mode it only
  // shows when the snapshot was built for a scope (and thus has per-member
  // JSON files behind the switcher).
  const showProjectSwitcher = !isStatic || staticScope;

  return (
    <div className="app">
      <ConnectionBanner isError={isError} />
      <header className="header">
        <h1>Archon</h1>
        <span className="version-badge" title={`Archon dashboard v${APP_VERSION}`}>
          v{APP_VERSION}
        </span>
        {project && <span className="project-badge" title={project.path}>{project.name}</span>}
        {isStatic && <span className="project-badge" title={window.__ARCHON_STATIC__?.generatedAt}>static</span>}
        {showProjectSwitcher && <ProjectSwitcher />}
        <nav className="header-nav">
          {showScopeHome && (
            <NavLink to="/scope" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Scope Home
            </NavLink>
          )}
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>Overview</NavLink>
          <NavLink to="/dag" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>DAG</NavLink>
          <NavLink to="/blueprint" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Blueprint</NavLink>
          {showCode && <NavLink to="/code" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Code</NavLink>}
          {!isStatic && <NavLink to="/logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Logs</NavLink>}
          {!isStatic && <NavLink to="/diffs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Diffs</NavLink>}
          <NavLink to="/journal" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Journal</NavLink>
        </nav>
        <ThemeToggle />
      </header>
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={inScopeMode && !projectScope ? <Navigate to="/scope" replace /> : <Overview />}
          />
          {/* The old proof-graph view is superseded by the DAG. */}
          <Route path="/graph" element={<Navigate to="/dag" replace />} />
          <Route path="/dag" element={<DagView />} />
          <Route path="/blueprint" element={<Blueprint />} />
          <Route path="/code" element={showCode ? <CodeView /> : <Navigate to="/diffs" replace />} />
          <Route path="/scope" element={showScopeHome ? <ScopeHome /> : <Navigate to="/" replace />} />
          <Route path="/logs" element={isStatic ? <Navigate to="/" replace /> : <LogViewer />} />
          <Route path="/diffs" element={isStatic ? <Navigate to="/" replace /> : <DiffPlayback />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
