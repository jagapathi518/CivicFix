import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaints } from '../../services/api';
import StatusBadge, { PriorityBadge } from '../../components/StatusBadge';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function WorkerComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [evidenceType, setEvidenceType] = useState('BEFORE_WORK');

  useEffect(() => { loadComplaint(); }, [id]);

  const loadComplaint = () => {
    complaints.getById(id)
      .then(res => setComplaint(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    setError('');
    try {
      if (action === 'accept') await complaints.accept(id);
      else if (action === 'start') await complaints.start(id);
      else if (action === 'resolve') await complaints.resolve(id, { notes });
      loadComplaint();
    } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUploadEvidence = async () => {
    if (!imageFile) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('evidence_type', evidenceType);
      await complaints.addEvidence(id, formData);
      setImageFile(null);
      setImagePreview(null);
      loadComplaint();
    } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (error && !complaint) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate('/worker')}>← Back</button>

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
        {/* Left */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {/* Details */}
          <div className="card">
            <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>Complaint Details</h2></div>
            <div className="card-body">
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div className="dp"><span className="dp-l">Department</span><span>{complaint.department_name}</span></div>
                <div className="dp"><span className="dp-l">Category</span><span>{complaint.category_name}</span></div>
                <div className="dp"><span className="dp-l">Submitted</span><span>{formatDate(complaint.created_at)}</span></div>
                <div className="dp"><span className="dp-l">Location</span><span>{[complaint.address, complaint.landmark, complaint.city, complaint.state].filter(Boolean).join(', ') || '—'}</span></div>
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
              <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>Evidence</h2></div>
              <div className="card-body">
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem'}}>
                  {complaint.evidence.map(ev => (
                    <div key={ev.id}>
                      <img src={`${API_BASE}${ev.file_url}`} alt="Evidence" style={{width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-md)'}} />
                      <div className="text-sm text-secondary mt-1">{ev.evidence_type.replace(/_/g, ' ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upload Evidence */}
          {['ASSIGNED', 'IN_PROGRESS'].includes(complaint.status) && (
            <div className="card">
              <div className="card-header"><h2 style={{fontSize: '1rem', fontWeight: 600}}>Upload Work Evidence</h2></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Evidence Type</label>
                  <select className="form-select" value={evidenceType} onChange={e => setEvidenceType(e.target.value)}>
                    <option value="BEFORE_WORK">Before Work</option>
                    <option value="AFTER_WORK">After Work</option>
                  </select>
                </div>
                {imagePreview ? (
                  <div style={{textAlign: 'center', marginBottom: '1rem'}}>
                    <img src={imagePreview} alt="Preview" style={{maxHeight: '200px', borderRadius: 'var(--radius-md)', margin: '0 auto'}} />
                    <button className="btn btn-ghost btn-sm mt-2" onClick={() => { setImageFile(null); setImagePreview(null); }}>Remove</button>
                  </div>
                ) : (
                  <label style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem', border: '2px dashed var(--border-medium)', borderRadius: 'var(--radius-lg)', cursor: 'pointer'}}>
                    <span style={{fontSize: '2rem'}}>📷</span>
                    <span className="text-sm">Click to upload image</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} hidden />
                  </label>
                )}
                {imageFile && (
                  <button className="btn btn-primary mt-2" onClick={handleUploadEvidence} disabled={actionLoading} style={{width: '100%'}}>
                    Upload Evidence
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {/* Action Buttons */}
          <div className="card">
            <div className="card-header"><h2 style={{fontSize: '0.875rem', fontWeight: 600}}>Actions</h2></div>
            <div className="card-body" style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              {complaint.status === 'ASSIGNED' && (
                <>
                  <button className="btn btn-primary" onClick={() => handleAction('accept')} disabled={actionLoading} style={{width: '100%'}}>
                    ✅ Accept Assignment
                  </button>
                  <button className="btn btn-warning" onClick={() => handleAction('start')} disabled={actionLoading} style={{width: '100%'}}>
                    🔧 Start Work
                  </button>
                </>
              )}
              {complaint.status === 'IN_PROGRESS' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Resolution Notes</label>
                    <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Describe the work done..." rows={3} />
                  </div>
                  <button className="btn btn-success" onClick={() => handleAction('resolve')} disabled={actionLoading} style={{width: '100%'}}>
                    ✓ Mark as Resolved
                  </button>
                </>
              )}
              {['RESOLVED', 'CLOSED'].includes(complaint.status) && (
                <div className="alert alert-success" style={{marginBottom: 0}}>
                  ✅ This complaint has been resolved.
                </div>
              )}
            </div>
          </div>

          {/* SLA */}
          <div className="card">
            <div className="card-body">
              <div className="dp"><span className="dp-l">Due Date</span><span>{formatDate(complaint.due_date)}</span></div>
              {complaint.due_date && new Date(complaint.due_date) < new Date() && !['RESOLVED', 'CLOSED'].includes(complaint.status) && (
                <div className="alert alert-error mt-2" style={{marginBottom: 0}}>⚠️ Overdue!</div>
              )}
            </div>
          </div>

          {/* Citizen Info */}
          <div className="card">
            <div className="card-header"><h2 style={{fontSize: '0.875rem', fontWeight: 600}}>Citizen Info</h2></div>
            <div className="card-body">
              <div className="dp"><span className="dp-l">Name</span><span>{complaint.citizen_name}</span></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dp { display: flex; flex-direction: column; gap: 0.125rem; }
        .dp-l { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-tertiary); font-weight: 600; }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 2fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
