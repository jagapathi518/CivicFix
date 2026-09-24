import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      const dashMap = { CITIZEN: '/dashboard', ADMIN: '/admin', SUPER_ADMIN: '/admin', WORKER: '/worker' };
      navigate(dashMap[user.role] || '/dashboard');
    } catch (err) {
      // error is set by context
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const accounts = {
      citizen: { email: 'citizen@example.com', password: 'password123' },
      admin: { email: 'admin@example.com', password: 'password123' },
      worker: { email: 'worker@example.com', password: 'password123' },
      superadmin: { email: 'superadmin@example.com', password: 'password123' },
    };
    setEmail(accounts[role].email);
    setPassword(accounts[role].password);
    setError(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-brand">🏛️ CivicFix</Link>
          <h1>Welcome back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{width: '100%'}}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>

        {/* Demo accounts */}
        <div className="demo-accounts">
          <p className="demo-title">Demo Accounts</p>
          <div className="demo-buttons">
            <button onClick={() => fillDemo('citizen')} className="btn btn-ghost btn-sm">👤 Citizen</button>
            <button onClick={() => fillDemo('admin')} className="btn btn-ghost btn-sm">🛡️ Admin</button>
            <button onClick={() => fillDemo('worker')} className="btn btn-ghost btn-sm">🔧 Worker</button>
            <button onClick={() => fillDemo('superadmin')} className="btn btn-ghost btn-sm">⚙️ Super Admin</button>
          </div>
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

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-brand {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          display: block;
          margin-bottom: 1.5rem;
        }

        .auth-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.375rem;
        }

        .auth-header p {
          color: var(--text-secondary);
          font-size: 0.9375rem;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .demo-accounts {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-light);
        }

        .demo-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          text-align: center;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }

        .demo-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}
