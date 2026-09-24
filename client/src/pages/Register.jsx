import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      // error set by context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-brand">🏛️ CivicFix</Link>
          <h1>Create your account</h1>
          <p>Join as a citizen to report and track issues</p>
        </div>

        {(error || formError) && <div className="alert alert-error">{error || formError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-input" value={form.name}
              onChange={handleChange} placeholder="Enter your full name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-input" value={form.email}
              onChange={handleChange} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <input type="tel" name="phone" className="form-input" value={form.phone}
              onChange={handleChange} placeholder="Enter your phone number" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" value={form.password}
              onChange={handleChange} placeholder="At least 6 characters" required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" name="confirmPassword" className="form-input" value={form.confirmPassword}
              onChange={handleChange} placeholder="Re-enter your password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{width: '100%'}}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, var(--primary-50), var(--bg-secondary));
        }
        .auth-card {
          background: var(--bg-primary);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          padding: 2.5rem;
          width: 100%;
          max-width: 440px;
          border: 1px solid var(--border-light);
        }
        .auth-header { text-align: center; margin-bottom: 2rem; }
        .auth-brand { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); display: block; margin-bottom: 1.5rem; }
        .auth-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.375rem; }
        .auth-header p { color: var(--text-secondary); font-size: 0.9375rem; }
        .auth-footer { text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: var(--text-secondary); }
      `}</style>
    </div>
  );
}
