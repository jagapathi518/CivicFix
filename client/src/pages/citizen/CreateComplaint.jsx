import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { departments as deptApi, categories as catApi, complaints } from '../../services/api';

const STEPS = ['Department', 'Category', 'Details', 'Location', 'Image', 'Review'];

export default function CreateComplaint() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [depts, setDepts] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    department_id: '', category_id: '', title: '', description: '',
    address: '', landmark: '', city: '', state: '', pincode: ''
  });

  useEffect(() => {
    deptApi.getAll().then(res => setDepts(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.department_id) {
      catApi.getAll(form.department_id).then(res => setCats(res.data)).catch(() => setCats([]));
    }
  }, [form.department_id]);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const nextStep = () => {
    // Validate current step
    if (step === 0 && !form.department_id) { setError('Please select a department'); return; }
    if (step === 1 && !form.category_id) { setError('Please select a category'); return; }
    if (step === 2 && (!form.title || !form.description)) { setError('Title and description are required'); return; }
    setError('');
    setStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await complaints.create(form);
      const complaint = res.data;

      // Upload image if provided
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('evidence_type', 'CITIZEN_REPORT');
        await complaints.addEvidence(complaint.id, formData);
      }

      navigate(`/complaints/${complaint.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedDept = depts.find(d => d.id === form.department_id);
  const selectedCat = cats.find(c => c.id === form.category_id);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Report a Problem</h1>
        <p className="page-subtitle">Help us identify and resolve civic issues</p>
      </div>

      {/* Progress */}
      <div className="progress-bar mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className={`progress-step ${i === step ? 'active' : i < step ? 'completed' : ''}`}>
            <div className="progress-dot">{i < step ? '✓' : i + 1}</div>
            <span className="progress-label">{s}</span>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-body" style={{maxWidth: '600px', margin: '0 auto'}}>

          {/* Step 0: Department */}
          {step === 0 && (
            <div>
              <h2 className="step-title">Select Department</h2>
              <p className="step-desc">Choose the department related to your issue</p>
              <div className="option-grid">
                {depts.map(d => (
                  <button key={d.id}
                    className={`option-card ${form.department_id === d.id ? 'selected' : ''}`}
                    onClick={() => { updateForm('department_id', d.id); updateForm('category_id', ''); }}
                  >
                    <span className="option-name">{d.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Category */}
          {step === 1 && (
            <div>
              <h2 className="step-title">Select Category</h2>
              <p className="step-desc">Narrow down the type of issue</p>
              <div className="option-grid">
                {cats.map(c => (
                  <button key={c.id}
                    className={`option-card ${form.category_id === c.id ? 'selected' : ''}`}
                    onClick={() => updateForm('category_id', c.id)}
                  >
                    <span className="option-name">{c.name}</span>
                  </button>
                ))}
              </div>
              {cats.length === 0 && <p className="text-secondary">No categories found for this department.</p>}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div>
              <h2 className="step-title">Describe the Issue</h2>
              <div className="form-group">
                <label className="form-label">Complaint Title *</label>
                <input type="text" className="form-input" value={form.title}
                  onChange={e => updateForm('title', e.target.value)}
                  placeholder="e.g. Large pothole near school entrance" />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  placeholder="Describe the problem in detail. Include size, severity, and any impact on public safety."
                  rows={5} />
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div>
              <h2 className="step-title">Location</h2>
              <p className="step-desc">Where is the issue located?</p>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" className="form-input" value={form.address}
                  onChange={e => updateForm('address', e.target.value)}
                  placeholder="Street address or area name" />
              </div>
              <div className="form-group">
                <label className="form-label">Landmark</label>
                <input type="text" className="form-input" value={form.landmark}
                  onChange={e => updateForm('landmark', e.target.value)}
                  placeholder="Nearby landmark" />
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" className="form-input" value={form.city}
                    onChange={e => updateForm('city', e.target.value)} placeholder="City" />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" className="form-input" value={form.state}
                    onChange={e => updateForm('state', e.target.value)} placeholder="State" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">PIN Code</label>
                <input type="text" className="form-input" value={form.pincode}
                  onChange={e => updateForm('pincode', e.target.value)} placeholder="PIN code" maxLength={6} style={{maxWidth: '200px'}} />
              </div>
            </div>
          )}

          {/* Step 4: Image */}
          {step === 4 && (
            <div>
              <h2 className="step-title">Upload Evidence</h2>
              <p className="step-desc">Upload a photo of the issue (optional but recommended)</p>
              <div className="upload-area">
                {imagePreview ? (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button className="btn btn-ghost btn-sm" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                      Remove image
                    </button>
                  </div>
                ) : (
                  <label className="upload-placeholder">
                    <span style={{fontSize: '2.5rem'}}>📷</span>
                    <span style={{fontWeight: 500}}>Click to upload image</span>
                    <span className="text-sm text-secondary">JPG, PNG, or WebP — Max 5MB</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} hidden />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div>
              <h2 className="step-title">Review & Submit</h2>
              <p className="step-desc">Please review the information before submitting</p>
              <div className="review-section">
                <div className="review-item"><span className="review-label">Department</span><span>{selectedDept?.name}</span></div>
                <div className="review-item"><span className="review-label">Category</span><span>{selectedCat?.name}</span></div>
                <div className="review-item"><span className="review-label">Title</span><span>{form.title}</span></div>
                <div className="review-item"><span className="review-label">Description</span><span>{form.description}</span></div>
                <div className="review-item"><span className="review-label">Location</span><span>{[form.address, form.landmark, form.city, form.state, form.pincode].filter(Boolean).join(', ') || '—'}</span></div>
                <div className="review-item"><span className="review-label">Image</span><span>{imageFile ? imageFile.name : 'No image'}</span></div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="step-nav">
            {step > 0 && <button className="btn btn-secondary" onClick={prevStep}>← Back</button>}
            <div style={{flex: 1}} />
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" onClick={nextStep}>Next →</button>
            ) : (
              <button className="btn btn-success btn-lg" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : '✓ Submit Complaint'}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .progress-bar { display: flex; gap: 0.25rem; align-items: center; justify-content: center; flex-wrap: wrap; }
        .progress-step { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.8125rem; color: var(--text-tertiary); }
        .progress-step.active { color: var(--primary-600); font-weight: 600; }
        .progress-step.completed { color: var(--text-secondary); }
        .progress-dot {
          width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 600; background: var(--gray-200); color: var(--text-secondary);
        }
        .progress-step.active .progress-dot { background: var(--primary-600); color: white; }
        .progress-step.completed .progress-dot { background: #dcfce7; color: #15803d; }
        .progress-label { display: none; }
        @media (min-width: 768px) { .progress-label { display: inline; } }

        .step-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem; }
        .step-desc { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1.5rem; }

        .option-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
        .option-card {
          padding: 1rem; border: 2px solid var(--border-light); border-radius: var(--radius-md);
          background: var(--bg-primary); cursor: pointer; text-align: left;
          transition: all var(--transition-fast);
        }
        .option-card:hover { border-color: var(--primary-300); background: var(--primary-50); }
        .option-card.selected { border-color: var(--primary-600); background: var(--primary-50); }
        .option-name { font-size: 0.875rem; font-weight: 500; }

        .upload-area { margin-bottom: 1rem; }
        .upload-placeholder {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 3rem; border: 2px dashed var(--border-medium); border-radius: var(--radius-lg);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .upload-placeholder:hover { border-color: var(--primary-400); background: var(--primary-50); }
        .image-preview { text-align: center; }
        .image-preview img { max-height: 300px; border-radius: var(--radius-md); margin: 0 auto 1rem; }

        .review-section { display: flex; flex-direction: column; gap: 0.75rem; }
        .review-item {
          display: flex; flex-direction: column; gap: 0.125rem; padding: 0.75rem;
          background: var(--bg-secondary); border-radius: var(--radius-md);
        }
        .review-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-tertiary); font-weight: 600; }

        .step-nav { display: flex; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-light); }
      `}</style>
    </div>
  );
}
