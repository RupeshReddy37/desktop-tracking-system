import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon"><LayoutDashboard size={24} /></div>
          <div>
            <strong>Work Day</strong>
            <span>Employee Monitoring Console</span>
          </div>
        </div>

        <h1>Sign in</h1>
        <p className="login-subtitle">Use your administrator credentials to access the console.</p>

        {error ? <div className="error-banner">{error}</div> : null}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span className="field-label">Username</span>
            <input
              className="input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
              autoComplete="username"
              autoFocus
            />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="action-btn action-primary login-submit" disabled={submitting}>
            {submitting ? <LoaderCircle size={16} className="spin" /> : null}
            <span>{submitting ? 'Signing in...' : 'Sign in'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
