import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaints } from '../../services/api';
import StatusBadge, { PriorityBadge } from '../../components/StatusBadge';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadComplaint();
  }, [id]);

  const loadComplaint = () => {
    complaints.getById(id)
      .then(res => setComplaint(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommentLoading(true);
    try {
      await complaints.addComment(id, { comment });
      setComment('');
      loadComplaint();
    } catch (err) {
      setError(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleVerify = async (isResolved) => {
    setVerifyLoading(true);
    try {
      await complaints.verify(id, {
        is_resolved: isResolved,
        rating: isResolved ? rating : undefined,
        feedback: isResolved ? feedback : feedback || 'Issue not resolved'
      });
      loadComplaint();
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';

  const statusLabels = {
    'NEW': 'Complaint Submitted', 'UNDER_REVIEW': 'Under Review', 'ASSIGNED': 'Assigned to Field Worker',
    'IN_PROGRESS': 'Work In Progress', 'RESOLVED': 'Issue Resolved', 'CITIZEN_VERIFICATION': 'Awaiting Your Verification',
    'CLOSED': 'Closed', 'REOPENED': 'Reopened'
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (error && !complaint) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate(-1)}>← Back</button>

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

      <div className="details-grid">
        {/* Main Info */}
        <div className="card">
          <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>Complaint Details</h2></div>
          <div className="card-body">
            <div className="detail-pairs">
              <div className="detail-pair"><span className="dp-label">Department</span><span>{complaint.department_name || '—'}</span></div>
              <div className="detail-pair"><span className="dp-label">Category</span><span>{complaint.category_name || '—'}</span></div>
              <div className="detail-pair"><span className="dp-label">Submitted</span><span>{formatDate(complaint.created_at)}</span></div>
              <div className="detail-pair"><span className="dp-label">Last Updated</span><span>{formatDate(complaint.updated_at)}</span></div>
              <div className="detail-pair"><span className="dp-label">Location</span><span>{[complaint.address, complaint.landmark, complaint.city, complaint.state, complaint.pincode].filter(Boolean).join(', ') || '—'}</span></div>
            </div>
            <div style={{marginTop: '1.25rem'}}>
              <div className="dp-label" style={{marginBottom: '0.5rem'}}>Description</div>
              <p style={{fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-secondary)'}}>{complaint.description}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>Status Timeline</h2></div>
          <div className="card-body">
            <div className="timeline">
              {complaint.history?.map((entry, i) => (
                <div key={i} className={`timeline-item ${i === complaint.history.length - 1 ? 'current' : ''}`}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-status">{statusLabels[entry.new_status] || entry.new_status}</div>
                    {entry.comment && <div className="timeline-comment">{entry.comment}</div>}
                    <div className="timeline-date">{formatDate(entry.created_at)}{entry.changed_by_name ? ` · ${entry.changed_by_name}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Evidence */}
        {complaint.evidence && complaint.evidence.length > 0 && (
          <div className="card">
            <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>Evidence / Images</h2></div>
            <div className="card-body">
              <div className="evidence-grid">
                {complaint.evidence.map(ev => (
                  <div key={ev.id} className="evidence-item">
                    <img src={`${API_BASE}${ev.file_url}`} alt="Evidence" />
                    <div className="evidence-meta">
                      <span className="badge badge-new">{ev.evidence_type.replace('_', ' ')}</span>
                      <span className="text-sm text-secondary">{formatDate(ev.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Verification (shown when RESOLVED) */}
        {complaint.status === 'RESOLVED' && (
          <div className="card" style={{borderColor: '#22c55e'}}>
            <div className="card-header" style={{background: '#f0fdf4'}}>
              <h2 style={{fontSize: '1rem', fontWeight: 600, color: '#15803d'}}>✅ Verification Required</h2>
            </div>
            <div className="card-body">
              <p style={{marginBottom: '1rem', fontWeight: 500}}>Has this issue been actually resolved?</p>
              <div className="form-group">
                <label className="form-label">Rating (if resolved)</label>
                <div className="star-rating">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} className={`star ${s <= rating ? 'active' : ''}`} onClick={() => setRating(s)}>★</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Feedback (optional)</label>
                <textarea className="form-textarea" value={feedback} onChange={e => setFeedback(e.target.value)}
                  placeholder="Any comments about the resolution" rows={3} />
              </div>
              <div className="flex gap-md">
                <button className="btn btn-success" onClick={() => handleVerify(true)} disabled={verifyLoading}>
                  ✅ Yes — Close Complaint
                </button>
                <button className="btn btn-danger" onClick={() => handleVerify(false)} disabled={verifyLoading}>
                  ❌ No — Reopen Complaint
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rating display */}
        {complaint.rating && (
          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-sm">
                <span className="dp-label">Your Rating:</span>
                <span>{'★'.repeat(complaint.rating.rating)}{'☆'.repeat(5 - complaint.rating.rating)}</span>
              </div>
              {complaint.rating.feedback && <p className="text-sm text-secondary mt-2">{complaint.rating.feedback}</p>}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="card">
          <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>Comments</h2></div>
          <div className="card-body">
            {complaint.comments?.length === 0 && <p className="text-secondary text-sm">No comments yet</p>}
            <div className="comments-list">
              {complaint.comments?.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{c.user_name}</span>
                    <span className="comment-role badge badge-new" style={{fontSize: '0.625rem'}}>{c.user_role}</span>
                    <span className="comment-date">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="comment-text">{c.comment}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className="comment-form">
              <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Add a comment..." rows={2} />
              <button type="submit" className="btn btn-primary btn-sm" disabled={commentLoading}>
                {commentLoading ? '...' : 'Post Comment'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .details-grid { display: flex; flex-direction: column; gap: 1rem; }
        .detail-pairs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .detail-pair { display: flex; flex-direction: column; gap: 0.125rem; }
        .dp-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-tertiary); font-weight: 600; }
        .timeline { padding-left: 1rem; border-left: 2px solid var(--border-medium); }
        .timeline-item { position: relative; padding: 0 0 1.25rem 1.25rem; }
        .timeline-item:last-child { padding-bottom: 0; }
        .timeline-dot {
          position: absolute; left: -1.35rem; top: 0.25rem; width: 10px; height: 10px;
          border-radius: 50%; background: var(--gray-400); border: 2px solid var(--bg-primary);
        }
        .timeline-item.current .timeline-dot { background: var(--primary-600); box-shadow: 0 0 0 3px var(--primary-100); }
        .timeline-status { font-size: 0.875rem; font-weight: 500; }
        .timeline-comment { font-size: 0.8125rem; color: var(--text-secondary); margin-top: 0.125rem; }
        .timeline-date { font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.125rem; }
        .evidence-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .evidence-item img { width: 100%; height: 180px; object-fit: cover; border-radius: var(--radius-md); }
        .evidence-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; }
        .comments-list { margin-bottom: 1.5rem; }
        .comment-item { padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 0.5rem; }
        .comment-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem; }
        .comment-author { font-size: 0.8125rem; font-weight: 600; }
        .comment-date { font-size: 0.75rem; color: var(--text-tertiary); margin-left: auto; }
        .comment-text { font-size: 0.875rem; color: var(--text-secondary); }
        .comment-form { display: flex; flex-direction: column; gap: 0.5rem; }
        .star-rating { display: flex; gap: 0.25rem; }
        .star { background: none; font-size: 1.5rem; color: var(--gray-300); transition: color 0.1s; padding: 0; }
        .star.active, .star:hover { color: #f59e0b; }
        @media (max-width: 768px) { .detail-pairs { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
