import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaints, departments as deptApi, categories as catApi } from '../../services/api';
import StatusBadge, { PriorityBadge } from '../../components/StatusBadge';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AdminComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [depts, setDepts] = useState([]);
  const [cats, setCats] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [editPriority, setEditPriority] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [assignWorker, setAssignWorker] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = () => {
    Promise.all([
      complaints.getById(id),
      deptApi.getAll(),
    ]).then(([compRes, deptRes]) => {
      setComplaint(compRes.data);
      setDepts(deptRes.data);
      setEditPriority(compRes.data.priority);
      setEditStatus(compRes.data.status);
      // Load workers for the department
      loadWorkers(compRes.data.department_id);
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const loadWorkers = async (deptId) => {
    // We need a workers endpoint. Let's use a workaround for now.
    try {
      const res = await fetch(`${API_BASE}/api/complaints?status=placeholder_for_workers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('civicfix_token')}` }
      });
      // For now, workers will need to be loaded from a separate endpoint
      // We'll create a workaround
    } catch (err) {}
  };

  const handleUpdatePriority = async () => {
    setActionLoading(true);
    try {
      await complaints.update(id, { priority: editPriority });
      loadAll();
    } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleUpdateStatus = async () => {
    setActionLoading(true);
    try {
      await complaints.update(id, { status: editStatus });
      loadAll();
    } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleAssign = async () => {
    if (!assignWorker) return;
    setActionLoading(true);
    try {
      await complaints.assign(id, { worker_id: assignWorker });
      loadAll();
    } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await complaints.addComment(id, { comment, is_internal: isInternal });
      setComment('');
      loadAll();
    } catch (err) { setError(err.message); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';

  const statusLabels = {
    'NEW': 'Complaint Submitted', 'UNDER_REVIEW': 'Under Review', 'ASSIGNED': 'Assigned',
    'IN_PROGRESS': 'Work In Progress', 'RESOLVED': 'Resolved', 'CLOSED': 'Closed', 'REOPENED': 'Reopened'
  };

  const STATUS_TRANSITIONS = {
    'NEW': ['UNDER_REVIEW'], 'UNDER_REVIEW': ['ASSIGNED', 'NEW'], 'ASSIGNED': ['IN_PROGRESS'],
    'IN_PROGRESS': ['RESOLVED'], 'RESOLVED': ['CITIZEN_VERIFICATION'], 'REOPENED': ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS']
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (error && !complaint) return <div className="alert alert-error">{error}</div>;

  const allowedTransitions = STATUS_TRANSITIONS[complaint.status] || [];

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/admin/complaints')}>← Back to Complaints</button>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="page-header flex items-center justify-between" style={{flexWrap: 'wrap', gap: '0.5rem'}}>
        <div>
          <div className="flex items-center gap-md" style={{flexWrap: 'wrap'}}>
            <h1 className="page-title">{complaint.complaint_number}</h1>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
          <p className="page-subtitle mt-1">{complaint.title}</p>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem'}}>
        {/* Left: Details */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <div className="card">
            <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>Complaint Details</h2></div>
            <div className="card-body">
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div className="dp"><span className="dp-l">Department</span><span>{complaint.department_name || '—'}</span></div>
                <div className="dp"><span className="dp-l">Category</span><span>{complaint.category_name || '—'}</span></div>
                <div className="dp"><span className="dp-l">Citizen</span><span>{complaint.citizen_name} ({complaint.citizen_email})</span></div>
                <div className="dp"><span className="dp-l">Phone</span><span>{complaint.citizen_phone || '—'}</span></div>
                <div className="dp"><span className="dp-l">Submitted</span><span>{formatDate(complaint.created_at)}</span></div>
                <div className="dp"><span className="dp-l">Updated</span><span>{formatDate(complaint.updated_at)}</span></div>
                <div className="dp" style={{gridColumn: '1/-1'}}><span className="dp-l">Location</span><span>{[complaint.address, complaint.landmark, complaint.city, complaint.state, complaint.pincode].filter(Boolean).join(', ') || '—'}</span></div>
              </div>
              <div style={{marginTop: '1rem'}}>
                <span className="dp-l">Description</span>
                <p style={{marginTop: '0.25rem', lineHeight: 1.7, color: 'var(--text-secondary)'}}>{complaint.description}</p>
              </div>
            </div>
          </div>

          {/* Evidence */}
          {complaint.evidence?.length > 0 && (
            <div className="card">
              <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>Evidence ({complaint.evidence.length})</h2></div>
              <div className="card-body">
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem'}}>
                  {complaint.evidence.map(ev => (
                    <div key={ev.id}>
                      <img src={`${API_BASE}${ev.file_url}`} alt="Evidence" style={{width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-md)'}} />
                      <div className="text-sm text-secondary mt-1">{ev.evidence_type.replace('_', ' ')} · {ev.uploaded_by_name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>Timeline</h2></div>
            <div className="card-body">
              <div className="timeline">
                {complaint.history?.map((entry, i) => (
                  <div key={i} className={`timeline-item ${i === complaint.history.length - 1 ? 'current' : ''}`}>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-status">{statusLabels[entry.new_status] || entry.new_status}</div>
                      {entry.comment && <div style={{fontSize: '0.8125rem', color: 'var(--text-secondary)'}}>{entry.comment}</div>}
                      <div style={{fontSize: '0.75rem', color: 'var(--text-tertiary)'}}>{formatDate(entry.created_at)} · {entry.changed_by_name || 'System'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>Comments</h2></div>
            <div className="card-body">
              {complaint.comments?.map(c => (
                <div key={c.id} style={{padding: '0.75rem', background: c.is_internal ? '#fffbeb' : 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', borderLeft: c.is_internal ? '3px solid #f59e0b' : 'none'}}>
                  <div className="flex items-center gap-sm" style={{marginBottom: '0.25rem'}}>
                    <span style={{fontWeight: 600, fontSize: '0.8125rem'}}>{c.user_name}</span>
                    <span className="badge badge-new" style={{fontSize: '0.625rem'}}>{c.user_role}</span>
                    {c.is_internal && <span className="badge badge-assigned" style={{fontSize: '0.625rem'}}>Internal</span>}
                    <span style={{fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 'auto'}}>{formatDate(c.created_at)}</span>
                  </div>
                  <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>{c.comment}</p>
                </div>
              ))}
              <form onSubmit={handleComment} style={{marginTop: '1rem'}}>
                <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." rows={2} />
                <div className="flex items-center gap-md mt-2">
                  <label className="flex items-center gap-sm text-sm">
                    <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                    Internal note (hidden from citizen)
                  </label>
                  <button type="submit" className="btn btn-primary btn-sm" style={{marginLeft: 'auto'}}>Post</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {/* Change Priority */}
          <div className="card">
            <div className="card-header"><h2 style={{fontSize: '0.875rem', fontWeight: 600}}>Priority</h2></div>
            <div className="card-body">
              <select className="form-select" value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              {editPriority !== complaint.priority && (
                <button className="btn btn-primary btn-sm mt-2" onClick={handleUpdatePriority} disabled={actionLoading} style={{width: '100%'}}>
                  Update Priority
                </button>
              )}
            </div>
          </div>

          {/* Change Status */}
          {allowedTransitions.length > 0 && (
            <div className="card">
              <div className="card-header"><h2 style={{fontSize: '0.875rem', fontWeight: 600}}>Update Status</h2></div>
              <div className="card-body">
                <select className="form-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  <option value={complaint.status}>{statusLabels[complaint.status] || complaint.status} (current)</option>
                  {allowedTransitions.map(s => (
                    <option key={s} value={s}>{statusLabels[s] || s}</option>
                  ))}
                </select>
                {editStatus !== complaint.status && (
                  <button className="btn btn-warning btn-sm mt-2" onClick={handleUpdateStatus} disabled={actionLoading} style={{width: '100%'}}>
                    Change Status
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Assign Worker */}
          {['NEW', 'UNDER_REVIEW', 'REOPENED'].includes(complaint.status) && (
            <div className="card">
              <div className="card-header"><h2 style={{fontSize: '0.875rem', fontWeight: 600}}>Assign Worker</h2></div>
              <div className="card-body">
                <input type="text" className="form-input" placeholder="Enter Worker ID"
                  value={assignWorker} onChange={e => setAssignWorker(e.target.value)} />
                <p className="text-sm text-secondary mt-1">Paste the field worker's user ID</p>
                <button className="btn btn-primary btn-sm mt-2" onClick={handleAssign} disabled={actionLoading || !assignWorker} style={{width: '100%'}}>
                  Assign Complaint
                </button>
              </div>
            </div>
          )}

          {/* Assignment Info */}
          {complaint.assignment && (
            <div className="card">
              <div className="card-header"><h2 style={{fontSize: '0.875rem', fontWeight: 600}}>Assignment</h2></div>
              <div className="card-body">
                <div className="dp"><span className="dp-l">Worker</span><span>{complaint.assignment.worker_name}</span></div>
                <div className="dp mt-2"><span className="dp-l">Assigned</span><span>{formatDate(complaint.assignment.assigned_at)}</span></div>
                {complaint.assignment.accepted_at && <div className="dp mt-2"><span className="dp-l">Accepted</span><span>{formatDate(complaint.assignment.accepted_at)}</span></div>}
                {complaint.assignment.completed_at && <div className="dp mt-2"><span className="dp-l">Completed</span><span>{formatDate(complaint.assignment.completed_at)}</span></div>}
              </div>
            </div>
          )}

          {/* SLA */}
          <div className="card">
            <div className="card-header"><h2 style={{fontSize: '0.875rem', fontWeight: 600}}>SLA</h2></div>
            <div className="card-body">
              <div className="dp"><span className="dp-l">Due Date</span><span>{formatDate(complaint.due_date)}</span></div>
              {complaint.due_date && new Date(complaint.due_date) < new Date() && !['RESOLVED', 'CLOSED'].includes(complaint.status) && (
                <div className="alert alert-error mt-2" style={{marginBottom: 0}}>⚠️ This complaint is overdue!</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dp { display: flex; flex-direction: column; gap: 0.125rem; }
        .dp-l { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-tertiary); font-weight: 600; }
        .timeline { padding-left: 1rem; border-left: 2px solid var(--border-medium); }
        .timeline-item { position: relative; padding: 0 0 1.25rem 1.25rem; }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-dot { position: absolute; left: -1.35rem; top: 0.25rem; width: 10px; height: 10px; border-radius: 50%; background: var(--gray-400); border: 2px solid var(--bg-primary); }
        .timeline-item.current .timeline-dot { background: var(--primary-600); box-shadow: 0 0 0 3px var(--primary-100); }
        .timeline-status { font-size: 0.875rem; font-weight: 500; }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 2fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
