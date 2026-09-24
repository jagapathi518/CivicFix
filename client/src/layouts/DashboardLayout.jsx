import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = {
  CITIZEN: [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/complaints/new', label: 'New Complaint', icon: '📝' },
  ],
  ADMIN: [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/complaints', label: 'Complaints', icon: '📋' },
  ],
  SUPER_ADMIN: [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/complaints', label: 'Complaints', icon: '📋' },
  ],
  WORKER: [
    { path: '/worker', label: 'My Assignments', icon: '🔧' },
  ],
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = NAV_ITEMS[user?.role] || [];
  const roleLabels = { CITIZEN: 'Citizen', ADMIN: 'Dept Admin', SUPER_ADMIN: 'Super Admin', WORKER: 'Field Worker' };

  return (
    <div className="dashboard-layout">
      {/* Demo banner */}
      <div className="demo-banner">⚠️ Demo Environment — CivicFix Development Preview</div>

      {/* Mobile header */}
      <header className="dashboard-header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <Link to="/" className="header-brand">
          <span className="brand-icon">🏛️</span>
          <span className="brand-text">CivicFix</span>
        </Link>
        <div className="header-right">
          <div className="header-user">
            <span className="user-name">{user?.name}</span>
            <span className="user-role-badge">{roleLabels[user?.role]}</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/">
            <span className="brand-icon">🏛️</span>
            <span>CivicFix</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{roleLabels[user?.role]}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{width: '100%', marginTop: '0.75rem'}}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <main className="dashboard-main">
        {children}
      </main>

      <style>{`
        .dashboard-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0 1rem;
          height: var(--header-height);
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-light);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .menu-toggle {
          display: none;
          background: none;
          font-size: 1.25rem;
          padding: 0.5rem;
          color: var(--text-primary);
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1.125rem;
          color: var(--text-primary);
        }

        .brand-icon { font-size: 1.5rem; }

        .header-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .user-role-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          background: var(--primary-100);
          color: var(--primary-700);
          border-radius: 9999px;
        }

        .dashboard-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--gray-900);
          color: var(--gray-300);
          display: flex;
          flex-direction: column;
          z-index: 200;
          transition: transform var(--transition-slow);
        }

        .sidebar-brand {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .sidebar-brand a {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: white;
          font-weight: 700;
          font-size: 1.25rem;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          color: var(--gray-400);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.06);
          color: white;
        }

        .nav-item.active {
          background: var(--primary-700);
          color: white;
        }

        .nav-icon { font-size: 1.125rem; }

        .sidebar-footer {
          padding: 1rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .sidebar-user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sidebar-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary-600);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .sidebar-user-name {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--gray-200);
        }

        .sidebar-user-role {
          font-size: 0.6875rem;
          color: var(--gray-500);
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 150;
        }

        .dashboard-main {
          margin-left: var(--sidebar-width);
          padding: 1.5rem 2rem;
          min-height: calc(100vh - var(--header-height) - 28px);
        }

        /* Hide header brand on desktop (sidebar has it) */
        @media (min-width: 769px) {
          .dashboard-header {
            margin-left: var(--sidebar-width);
          }
          .header-brand {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .menu-toggle {
            display: block;
          }

          .dashboard-sidebar {
            transform: translateX(-100%);
          }

          .dashboard-sidebar.open {
            transform: translateX(0);
          }

          .dashboard-main {
            margin-left: 0;
            padding: 1rem;
          }

          .dashboard-header {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
