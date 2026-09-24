import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaints, departments as deptApi } from '../../services/api';
import StatusBadge, { PriorityBadge } from '../../components/StatusBadge';

export default function AdminComplaints() {
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [depts, setDepts] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', department_id: '', search: '', sort: 'newest' });

  useEffect(() => {
    deptApi.getAll().then(res => setDepts(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [filters]);

  const loadComplaints = () => {
    setLoading(true);
    const params = { ...filters, page: pagination.page, limit: 20 };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    complaints.getAll(params)
      .then(res => {
        setList(res.data.complaints);
        setPagination(res.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Complaint Management</h1>
        <p className="page-subtitle">View, filter, and manage all complaints</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input">
          <input type="text" className="form-input" placeholder="Search complaints..."
            value={filters.search} onChange={e => updateFilter('search', e.target.value)} />
        </div>
        <select className="form-select" value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REOPENED">Reopened</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select className="form-select" value={filters.priority} onChange={e => updateFilter('priority', e.target.value)}>
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select className="form-select" value={filters.department_id} onChange={e => updateFilter('department_id', e.target.value)}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="form-select" value={filters.sort} onChange={e => updateFilter('sort', e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="priority">Highest Priority</option>
          <option value="oldest_unresolved">Oldest Unresolved</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th className="hide-mobile">Department</th>
                  <th className="hide-mobile">Citizen</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="hide-mobile">Worker</th>
                  <th className="hide-mobile">Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map(c => (
                  <tr key={c.id}>
                    <td style={{fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8125rem'}}>{c.complaint_number}</td>
                    <td style={{maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{c.title}</td>
                    <td className="hide-mobile">{c.department_name || '—'}</td>
                    <td className="hide-mobile">{c.citizen_name || '—'}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="hide-mobile">{c.worker_name || '—'}</td>
                    <td className="hide-mobile">{formatDate(c.created_at)}</td>
                    <td>
                      <Link to={`/admin/complaints/${c.id}`} className="btn btn-ghost btn-sm">View →</Link>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr><td colSpan={9} className="text-center text-secondary p-6">No complaints found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-secondary">Showing {list.length} of {pagination.total} complaints</span>
              <div className="flex gap-sm">
                <button className="btn btn-secondary btn-sm" disabled={pagination.page <= 1}
                  onClick={() => setPagination(p => ({...p, page: p.page - 1}))}>← Prev</button>
                <span className="btn btn-ghost btn-sm">Page {pagination.page} of {pagination.pages}</span>
                <button className="btn btn-secondary btn-sm" disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(p => ({...p, page: p.page + 1}))}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
