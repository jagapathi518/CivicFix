import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaints } from '../../services/api';
import StatusBadge, { PriorityBadge } from '../../components/StatusBadge';

export default function CitizenDashboard() {
  const [stats, setStats] = useState(null);
  const [complaintList, setComplaintList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      complaints.getStats(),
      complaints.getAll({ page: 1, limit: 10, sort: 'newest' })
    ]).then(([statsRes, listRes]) => {
      setStats(statsRes.data);
      setComplaintList(listRes.data.complaints);
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-subtitle">Track and manage your complaints</p>
        </div>
        <Link to="/complaints/new" className="btn btn-primary">
          + New Complaint
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-6">
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#dbeafe', color: '#1d4ed8'}}>📋</div>
          <div className="stat-value">{stats?.total || 0}</div>
          <div className="stat-label">Total Complaints</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#fef3c7', color: '#b45309'}}>⏳</div>
          <div className="stat-value">{stats?.pending || 0}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#ffedd5', color: '#c2410c'}}>🔧</div>
          <div className="stat-value">{stats?.in_progress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#dcfce7', color: '#15803d'}}>✅</div>
          <div className="stat-value">{stats?.resolved || 0}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#f3f4f6', color: '#4b5563'}}>📁</div>
          <div className="stat-value">{stats?.closed || 0}</div>
          <div className="stat-label">Closed</div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card">
        <div className="card-header">
          <h2 style={{fontSize: '1rem', fontWeight: 600}}>My Complaints</h2>
        </div>
        {complaintList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p>No complaints yet</p>
            <Link to="/complaints/new" className="btn btn-primary btn-sm" style={{marginTop: '1rem'}}>
              Report your first issue
            </Link>
          </div>
        ) : (
          <div className="table-container" style={{border: 'none', borderRadius: 0}}>
            <table>
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Title</th>
                  <th className="hide-mobile">Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="hide-mobile">Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaintList.map(c => (
                  <tr key={c.id}>
                    <td style={{fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'monospace'}}>{c.complaint_number}</td>
                    <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{c.title}</td>
                    <td className="hide-mobile">{c.department_name || '—'}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="hide-mobile">{formatDate(c.created_at)}</td>
                    <td>
                      <Link to={`/complaints/${c.id}`} className="btn btn-ghost btn-sm">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
