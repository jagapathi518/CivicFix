import { useState } from 'react';
import { Link } from 'react-router-dom';
import { complaints } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function TrackComplaint() {
  const [complaintNumber, setComplaintNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!complaintNumber.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await complaints.track(complaintNumber.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Complaint not found');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const statusLabels = {
    'NEW': 'Complaint Submitted',
    'UNDER_REVIEW': 'Under Review',
    'ASSIGNED': 'Assigned to Field Worker',
    'IN_PROGRESS': 'Work In Progress',
    'RESOLVED': 'Resolved',
    'CITIZEN_VERIFICATION': 'Awaiting Citizen Verification',
    'CLOSED': 'Closed',
    'REOPENED': 'Reopened',
  };

  return (
    <div className="track-page">
      <nav className="landing-nav" style={{background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 100}}>
        <div className="container flex items-center justify-between" style={{height: '64px'}}>
          <Link to="/" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)'}}>
            <span style={{fontSize: '1.5rem'}}>🏛️</span> CivicFix
          </Link>
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{maxWidth: '640px', padding: '3rem 1.5rem'}}>
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <h1 style={{fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem'}}>Track Your Complaint</h1>
          <p className="text-secondary">Enter your complaint ID to check the current status</p>
        </div>

        <form onSubmit={handleTrack} style={{display: 'flex', gap: '0.75rem', marginBottom: '2rem'}}>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. CF-2026-000001"
            value={complaintNumber}
            onChange={e => setComplaintNumber(e.target.value)}
            style={{flex: 1, fontSize: '1rem'}}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '...' : '🔍 Track'}
          </button>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        {result && (
          <div className="card">
            <div className="card-header">
              <div>
                <div style={{fontWeight: 700, fontSize: '1.125rem'}}>{result.complaint_number}</div>
                <div className="text-sm text-secondary">{result.title}</div>
              </div>
              <StatusBadge status={result.status} />
            </div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{result.department_name || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">{result.category_name || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{[result.city, result.state].filter(Boolean).join(', ') || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Submitted</span>
                  <span className="detail-value">{formatDate(result.created_at)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last Updated</span>
                  <span className="detail-value">{formatDate(result.updated_at)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority</span>
                  <span className="detail-value"><span className={`badge badge-${result.priority?.toLowerCase()}`}>{result.priority}</span></span>
                </div>
              </div>

              {/* Timeline */}
              {result.timeline && result.timeline.length > 0 && (
                <div style={{marginTop: '1.5rem'}}>
                  <h3 style={{fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem'}}>Status Timeline</h3>
                  <div className="timeline">
                    {result.timeline.map((entry, i) => (
                      <div key={i} className={`timeline-item ${i === result.timeline.length - 1 ? 'current' : ''}`}>
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="timeline-status">{statusLabels[entry.new_status] || entry.new_status}</div>
                          <div className="timeline-date">{formatDate(entry.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .track-page { min-height: 100vh; background: var(--bg-secondary); }
        .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .detail-item { display: flex; flex-direction: column; gap: 0.125rem; }
        .detail-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-tertiary); font-weight: 600; }
        .detail-value { font-size: 0.9375rem; color: var(--text-primary); }
        .timeline { padding-left: 1rem; border-left: 2px solid var(--border-medium); }
        .timeline-item { position: relative; padding: 0 0 1.25rem 1.25rem; }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-dot {
          position: absolute; left: -1.35rem; top: 0.25rem;
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--gray-400); border: 2px solid var(--bg-primary);
        }
        .timeline-item.current .timeline-dot { background: var(--primary-600); box-shadow: 0 0 0 3px var(--primary-100); }
        .timeline-status { font-size: 0.875rem; font-weight: 500; }
        .timeline-date { font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.125rem; }
        @media (max-width: 480px) { .detail-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
