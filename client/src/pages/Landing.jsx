import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { analytics } from '../services/api';

export default function Landing() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    analytics.getPublic()
      .then(res => setStats(res.data))
      .catch(() => setStats({ total_complaints: '—', resolved: '—', departments: '—', avg_resolution_hours: '—' }));
  }, []);

  return (
    <div className="landing">
      {/* Demo banner */}
      <div className="demo-banner">⚠️ Demo Environment — CivicFix Development Preview</div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="container flex items-center justify-between" style={{height: '64px'}}>
          <Link to="/" className="landing-brand">
            <span style={{fontSize: '1.5rem'}}>🏛️</span>
            <span>CivicFix</span>
          </Link>
          <div className="landing-nav-links">
            <Link to="/track" className="nav-link">Track Complaint</Link>
            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">Citizen-Powered Platform</div>
            <h1>Report Public Problems.<br />Track Real Progress.</h1>
            <p className="hero-subtitle">
              CivicFix connects citizens with the departments responsible for fixing
              public infrastructure and service issues. Report it. Track it. Fix it.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                📝 Report a Problem
              </Link>
              <Link to="/track" className="btn btn-secondary btn-lg">
                🔍 Track Complaint
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section" style={{background: 'var(--bg-primary)'}}>
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Simple 5-step process from report to resolution</p>
          <div className="steps-grid">
            {[
              { step: '1', icon: '📝', title: 'Report', desc: 'Submit your complaint with details and photos' },
              { step: '2', icon: '🔍', title: 'Review', desc: 'Department reviews and prioritizes your issue' },
              { step: '3', icon: '👷', title: 'Assign', desc: 'Field worker is assigned to resolve the issue' },
              { step: '4', icon: '🔧', title: 'Fix', desc: 'Worker addresses the problem on-site' },
              { step: '5', icon: '✅', title: 'Verify', desc: 'You verify the resolution and close the case' },
            ].map(s => (
              <div key={s.step} className="step-card">
                <div className="step-number">{s.step}</div>
                <div className="step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Supported Services</h2>
          <p className="section-subtitle">Report issues across multiple departments</p>
          <div className="services-grid">
            {[
              { icon: '🛣️', name: 'Roads & Highways' },
              { icon: '🏥', name: 'Hospitals' },
              { icon: '🏫', name: 'Schools' },
              { icon: '💧', name: 'Water & Drainage' },
              { icon: '🗑️', name: 'Sanitation' },
              { icon: '💡', name: 'Street Lighting' },
              { icon: '⚡', name: 'Electricity' },
              { icon: '🚌', name: 'Public Transport' },
              { icon: '🏛️', name: 'Public Facilities' },
            ].map(s => (
              <div key={s.name} className="service-card">
                <span className="service-icon">{s.icon}</span>
                <span className="service-name">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section" style={{background: 'var(--gray-900)', color: 'white'}}>
        <div className="container">
          <h2 className="section-title" style={{color: 'white'}}>Platform Statistics</h2>
          <div className="landing-stats">
            <div className="landing-stat">
              <div className="landing-stat-value">{stats?.total_complaints ?? '...'}</div>
              <div className="landing-stat-label">Complaints Submitted</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value">{stats?.resolved ?? '...'}</div>
              <div className="landing-stat-label">Issues Resolved</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value">{stats?.departments ?? '...'}</div>
              <div className="landing-stat-label">Departments</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value">{stats?.avg_resolution_hours ? `${Math.round(stats.avg_resolution_hours)}h` : '...'}</div>
              <div className="landing-stat-label">Avg Resolution Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div>
              <div className="landing-brand" style={{marginBottom: '0.5rem'}}>
                <span style={{fontSize: '1.25rem'}}>🏛️</span>
                <span>CivicFix</span>
              </div>
              <p className="text-sm text-secondary">
                Citizen-powered public issue reporting and management platform.
              </p>
            </div>
            <div className="text-sm text-secondary">
              © {new Date().getFullYear()} CivicFix. Independent civic platform.
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .landing-nav {
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-light);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .landing-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-link {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .nav-link:hover { color: var(--primary-600); }

        .hero {
          background: linear-gradient(135deg, var(--primary-50) 0%, var(--bg-primary) 50%, #f0fdf4 100%);
          padding: 5rem 0;
        }

        .hero-content {
          max-width: 680px;
        }

        .hero-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: var(--primary-100);
          color: var(--primary-700);
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: 9999px;
          margin-bottom: 1.5rem;
        }

        .hero h1 {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.15;
          color: var(--text-primary);
          margin-bottom: 1.25rem;
        }

        .hero-subtitle {
          font-size: 1.125rem;
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .section {
          padding: 4rem 0;
        }

        .section-title {
          font-size: 1.75rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .section-subtitle {
          text-align: center;
          color: var(--text-secondary);
          margin-bottom: 2.5rem;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1.5rem;
        }

        .step-card {
          text-align: center;
          padding: 1.5rem 1rem;
          border-radius: var(--radius-lg);
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          position: relative;
        }

        .step-number {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--primary-600);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-icon {
          font-size: 2rem;
          margin-bottom: 0.75rem;
        }

        .step-card h3 {
          font-size: 1rem;
          margin-bottom: 0.375rem;
        }

        .step-card p {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
        }

        .service-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-light);
          background: var(--bg-primary);
          transition: all var(--transition-base);
        }

        .service-card:hover {
          border-color: var(--primary-300);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }

        .service-icon { font-size: 1.5rem; }
        .service-name { font-size: 0.875rem; font-weight: 500; }

        .landing-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          text-align: center;
        }

        .landing-stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--primary-400);
          margin-bottom: 0.25rem;
        }

        .landing-stat-label {
          font-size: 0.875rem;
          color: var(--gray-400);
        }

        .landing-footer {
          background: var(--bg-primary);
          padding: 2rem 0;
          border-top: 1px solid var(--border-light);
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        @media (max-width: 768px) {
          .hero h1 { font-size: 2rem; }
          .hero { padding: 3rem 0; }
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .landing-stats { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
          .footer-content { flex-direction: column; gap: 1rem; text-align: center; }
          .hero-actions { flex-direction: column; }
          .landing-nav-links .nav-link { display: none; }
        }
      `}</style>
    </div>
  );
}
