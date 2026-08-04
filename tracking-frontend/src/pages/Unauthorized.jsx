import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <div className="status-page">
      <ShieldAlert size={40} />
      <h1>Unauthorized</h1>
      <p>You need to sign in to access this page.</p>
      <Link to="/login" className="action-btn action-primary">Go to sign in</Link>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="status-page">
      <ShieldAlert size={40} />
      <h1>Forbidden</h1>
      <p>You do not have permission to access this resource.</p>
      <Link to="/dashboard" className="action-btn action-primary">Back to dashboard</Link>
    </div>
  );
}
