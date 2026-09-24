import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaints } from '../../services/api';
import StatusBadge, { PriorityBadge } from '../../components/StatusBadge';

export default function WorkerDashboard() {
  const [stats, setStats] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    Promise.all([
      complaints.getStats(),
      complaints.getAll({ page: 1, limit: 50 })
    ]).then(([statsRes, listRes]) => {
      setStats(statsRes.data);
      setList(listRes.data.complaints);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  const filtered = filter ? list.filter(c => c.status === filter) : list;

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Assignments</h1>
        <p className="page-subtitle">View and manage complaints assigned to you</p>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-6">
        <div className="stat-card" onClick={() => setFilter('')} style={{cursor: 'pointer'}}>
          <div className="stat-icon" style={{background: '#dbeafe', color: '#1d4ed8'}}>📋</div>
          <div className="stat-value">{stats?.total || 0}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card" onClick={() => setFilter('ASSIGNED')} style={{cursor: 'pointer'}}>
          <div className="stat-icon" style={{background: '#fef3c7', color: '#b45309'}}>📩</div>
          <div className="stat-value">{stats?.assigned || 0}</div>
          <div className="stat-label">New Assignments</div>
        </div>
        <div className="stat-card" onClick={() => setFilter('IN_PROGRESS')} style={{cursor: 'pointer'}}>
          <div className="stat-icon" style={{background: '#ffedd5', color: '#c2410c'}}>🔧</div>
          <div className="stat-value">{stats?.in_progress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card" onClick={() => setFilter('RESOLVED')} style={{cursor: 'pointer'}}>
          <div className="stat-icon" style={{background: '#dcfce7', color: '#15803d'}}>✅</div>
          <div className="stat-value">{stats?.resolved || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {filter && (
        <div className="flex items-center gap-sm mb-4">
          <span className="text-sm text-secondary">Filtered by: <StatusBadge status={filter} /></span>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter('')}>Clear</button>
        </div>
      )}

      {/* Complaint Cards */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>No assignments found</p>
        </div>
      ) : (
        <div className="worker-cards">
          {filtered.map(c => {
            const isOverdue = c.due_date && new Date(c.due_date) < new Date() && !['RESOLVED', 'CLOSED'].includes(c.status);
            return (
              <Link to={`/worker/complaints/${c.id}`} key={c.id} className="worker-card card" style={{textDecoration: 'none', color: 'inherit'}}>
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4" style={{flexWrap: 'wrap', gap: '0.5rem'}}>
                    <span style={{fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem'}}>{c.complaint_number}</span>
                    <div className="flex gap-sm">
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <h3 style={{fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem'}}>{c.title}</h3>
                  <p className="text-sm text-secondary" style={{lineHeight: 1.5, marginBottom: '0.75rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                    {c.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">📍 {c.city || c.state || '—'}</span>
                    <span className="text-secondary">{formatDate(c.created_at)}</span>
                  </div>
                  {isOverdue && <div className="alert alert-error mt-2" style={{marginBottom: 0, padding: '0.375rem 0.75rem', fontSize: '0.75rem'}}>⚠️ Overdue</div>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        .worker-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }
        .worker-card { transition: all var(--transition-base); }
        .worker-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
      `}</style>
    </div>
  );
}
