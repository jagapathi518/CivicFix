import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaints, analytics } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [deptStats, setDeptStats] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      complaints.getStats(),
      analytics.getDepartments().catch(() => ({ data: [] })),
      complaints.getAll({ page: 1, limit: 5, sort: 'newest' })
    ]).then(([statsRes, deptRes, listRes]) => {
      setStats(statsRes.data);
      setDeptStats(deptRes.data || []);
      setRecentComplaints(listRes.data.complaints);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const statCards = [
    { label: 'Total', value: stats?.total || 0, icon: '📋', bg: '#dbeafe', color: '#1d4ed8' },
    { label: 'New', value: stats?.new || 0, icon: '🆕', bg: '#dbeafe', color: '#2563eb' },
    { label: 'Under Review', value: stats?.under_review || 0, icon: '🔍', bg: '#ede9fe', color: '#6d28d9' },
    { label: 'Assigned', value: stats?.assigned || 0, icon: '👤', bg: '#fef3c7', color: '#b45309' },
    { label: 'In Progress', value: stats?.in_progress || 0, icon: '🔧', bg: '#ffedd5', color: '#c2410c' },
    { label: 'Resolved', value: stats?.resolved || 0, icon: '✅', bg: '#dcfce7', color: '#15803d' },
    { label: 'Reopened', value: stats?.reopened || 0, icon: '🔄', bg: '#fee2e2', color: '#b91c1c' },
    { label: 'Overdue', value: stats?.overdue || 0, icon: '⚠️', bg: '#fee2e2', color: '#dc2626' },
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Complaint overview and management</p>
        </div>
        <Link to="/admin/complaints" className="btn btn-primary">
          📋 All Complaints
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid mb-6" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'}}>
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{background: s.bg, color: s.color}}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
        {/* By Department */}
        <div className="card">
          <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>By Department</h2></div>
          <div className="card-body" style={{padding: 0}}>
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total</th>
                  <th>Resolved</th>
                  <th>Pending</th>
                </tr>
              </thead>
              <tbody>
                {deptStats.slice(0, 8).map(d => (
                  <tr key={d.id}>
                    <td style={{fontWeight: 500}}>{d.name}</td>
                    <td>{d.total}</td>
                    <td style={{color: '#15803d'}}>{d.resolved}</td>
                    <td style={{color: d.pending > 0 ? '#b45309' : 'inherit'}}>{d.pending}</td>
                  </tr>
                ))}
                {deptStats.length === 0 && <tr><td colSpan={4} className="text-center text-secondary p-4">No data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="card">
          <div className="card-header">
            <h2 style={{fontSize: '1rem', fontWeight: 600}}>Recent Complaints</h2>
            <Link to="/admin/complaints" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          <div className="card-body" style={{padding: 0}}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map(c => (
                  <tr key={c.id}>
                    <td><Link to={`/admin/complaints/${c.id}`} style={{fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem'}}>{c.complaint_number}</Link></td>
                    <td style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{c.title}</td>
                    <td><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
                {recentComplaints.length === 0 && <tr><td colSpan={3} className="text-center text-secondary p-4">No complaints</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start !important; gap: 0.75rem; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
