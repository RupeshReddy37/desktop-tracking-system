import { useEffect, useState } from 'react';
import { getServerHealth } from '../services/endpoints';
import { formatDateTime } from '../lib/format';
import { ErrorBanner } from '../components/ui/Primitives';

const ENDPOINTS = [
  { method: 'POST', path: '/api/v1/auth/login', desc: 'Sign in and receive access + refresh tokens.' },
  { method: 'POST', path: '/api/v1/auth/refresh', desc: 'Exchange a refresh token for a new access token.' },
  { method: 'POST', path: '/api/v1/auth/logout', desc: 'Invalidate the current refresh token.' },
  { method: 'GET', path: '/api/v1/dashboard/home', desc: 'Live employee statuses and counts.' },
  { method: 'GET', path: '/api/v1/dashboard/profile/{id}', desc: 'Detailed profile for one employee.' },
  { method: 'GET', path: '/api/v1/employees', desc: 'List all registered employees.' },
  { method: 'POST', path: '/api/v1/employees', desc: 'Create a new employee.' },
  { method: 'GET', path: '/api/v1/reports/daily-summary', desc: 'Daily usage summary rows.' },
  { method: 'GET', path: '/api/v1/reports/application-usage', desc: 'Application usage rows.' },
  { method: 'GET', path: '/api/v1/reports/daily-window-usage', desc: 'Window usage rows.' },
  { method: 'GET', path: '/api/v1/anomalies', desc: 'List detected anomalies.' },
  { method: 'GET', path: '/api/v1/devices', desc: 'List registered agent devices.' },
  { method: 'GET', path: '/actuator/health', desc: 'Server health check (no auth).' }
];

export function ApiPage() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getServerHealth()
      .then((data) => setHealth(data))
      .catch((err) => setError(`Health check failed: ${err.message}`));
  }, []);

  return (
    <div className="api-page">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>API reference</h2>
            <p>Endpoints exposed by the tracking server that this console consumes.</p>
          </div>
        </div>
        <ErrorBanner message={error} />
        <div className="health-card">
          <span className={`pulse ${health?.status === 'UP' ? 'ok' : ''}`} />
          <div>
            <strong>Server health: {health?.status || 'Unknown'}</strong>
            <small>Checked {formatDateTime(new Date().toISOString())}</small>
          </div>
        </div>
        <div className="endpoint-list">
          {ENDPOINTS.map((endpoint) => (
            <div className="endpoint-row" key={`${endpoint.method}-${endpoint.path}`}>
              <span className={`method method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
              <code>{endpoint.path}</code>
              <p>{endpoint.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
