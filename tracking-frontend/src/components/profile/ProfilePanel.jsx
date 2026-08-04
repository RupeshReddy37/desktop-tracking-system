import { X, RefreshCw, Pencil, UserX, Eye } from 'lucide-react';
import { formatDateTime, formatCompactDuration, safeText } from '../../lib/format';
import { employeeName, initialsFor, statusClass } from '../../utils/aggregate';
import { LoadingState } from '../ui/Primitives';

export function ProfilePanel({ profile, loading, onOperation, onClose }) {
  if (!profile) return null;

  return (
    <aside className="profile-panel">
      <div className="profile-head">
        <div className="profile-avatar">{initialsFor(profile)}</div>
        <div>
          <h3>{employeeName(profile)}</h3>
          <p>{safeText(profile.employeeCode)}</p>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close profile"><X size={16} /></button>
      </div>

      {loading ? <LoadingState label="Loading profile" /> : (
        <div className="profile-body">
          <div className="profile-section">
            <h4>Contact</h4>
            <dl className="detail-list">
              <dt>Email</dt>
              <dd>{safeText(profile.email)}</dd>
              <dt>Status</dt>
              <dd><span className={statusClass(profile.currentStatus)}>{safeText(profile.currentStatus)}</span></dd>
            </dl>
          </div>

          <div className="profile-section">
            <h4>Device</h4>
            <dl className="detail-list">
              <dt>Hostname</dt>
              <dd>{safeText(profile.hostname)}</dd>
              <dt>OS</dt>
              <dd>{safeText(profile.operatingSystem)}</dd>
              <dt>Agent version</dt>
              <dd>{safeText(profile.agentVersion)}</dd>
              <dt>Last seen</dt>
              <dd>{formatDateTime(profile.lastSeenAt)}</dd>
            </dl>
          </div>

          <div className="profile-section">
            <h4>Today</h4>
            <dl className="detail-list">
              <dt>Active</dt>
              <dd>{formatCompactDuration(profile.activeSecondsToday)}</dd>
              <dt>Idle</dt>
              <dd>{formatCompactDuration(profile.idleSecondsToday)}</dd>
              <dt>Locked</dt>
              <dd>{formatCompactDuration(profile.lockedSecondsToday)}</dd>
            </dl>
          </div>

          <div className="profile-actions">
            <button type="button" className="action-btn" onClick={() => onOperation('Refresh profile')}><RefreshCw size={15} /><span>Refresh</span></button>
            <button type="button" className="action-btn" onClick={() => onOperation('Edit employee')}><Pencil size={15} /><span>Edit</span></button>
            <button type="button" className="action-btn" onClick={() => onOperation('Deactivate employee')}><UserX size={15} /><span>Deactivate</span></button>
            <button type="button" className="action-btn" onClick={() => onOperation('View activity')}><Eye size={15} /><span>Activity</span></button>
          </div>
        </div>
      )}
    </aside>
  );
}
