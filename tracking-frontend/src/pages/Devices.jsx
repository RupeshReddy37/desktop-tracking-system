import { useEffect, useState } from 'react';
import { Monitor, RefreshCw } from 'lucide-react';
import { getDevices } from '../services/endpoints';
import { formatDateTime, safeText } from '../lib/format';
import { statusClass } from '../utils/aggregate';
import { ActionButton, EmptyState, ErrorBanner } from '../components/ui/Primitives';
import { DataTable } from '../components/ui/DataTable';

export function DevicesPage({ onToast }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getDevices();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      setDevices([]);
      setError(`Device list unavailable: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <div>
          <h2>Registered devices</h2>
        </div>
        <div className="panel-actions">
          <ActionButton icon={RefreshCw} onClick={load}>Refresh</ActionButton>
        </div>
      </div>
      <ErrorBanner message={error} />
      <DataTable
        columns={['Device', 'Hostname', 'OS', 'Status', 'Last seen', 'Agent version']}
        rows={devices}
        loading={loading}
        emptyTitle="No devices registered"
        emptyText="No agent devices have registered with the server yet."
        renderRow={(row) => (
          <>
            <td>
              <div className="person-cell">
                <span><Monitor size={14} /></span>
                <b>{safeText(row.deviceId)}</b>
              </div>
            </td>
            <td>{safeText(row.hostname)}</td>
            <td>{safeText(row.operatingSystem)}</td>
            <td><span className={statusClass(row.status)}>{safeText(row.status)}</span></td>
            <td>{formatDateTime(row.lastSeenAt)}</td>
            <td>{safeText(row.agentVersion)}</td>
          </>
        )}
      />
    </section>
  );
}
