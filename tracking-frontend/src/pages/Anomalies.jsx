import { useEffect, useMemo, useState } from 'react';
import { Filter, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getAnomalies } from '../services/endpoints';
import { formatDateTime, safeText } from '../lib/format';
import { ANOMALY_TYPE_OPTIONS, ANOMALY_STATUS_OPTIONS } from '../constants/navigation';
import { employeeName, initialsFor } from '../utils/aggregate';
import { SelectControl, ActionButton, EmptyState } from '../components/ui/Primitives';
import { DataTable } from '../components/ui/DataTable';

export function AnomaliesPage({ onToast }) {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getAnomalies({ page: 0, size: 200 });
        setAnomalies(Array.isArray(data) ? data : []);
      } catch (err) {
        setAnomalies([]);
        onToast(`Anomaly list unavailable: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => anomalies.filter((anomaly) => {
    if (typeFilter !== 'all' && anomaly.anomalyType !== typeFilter) return false;
    if (statusFilter !== 'all' && anomaly.status !== statusFilter) return false;
    return true;
  }), [anomalies, typeFilter, statusFilter]);

  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <div>
          <h2>Anomaly review</h2>
        </div>
        <div className="panel-actions">
          <ActionButton icon={Filter} onClick={() => setFiltersOpen((value) => !value)}>Filters</ActionButton>
        </div>
      </div>
      {filtersOpen ? (
        <div className="filter-tray">
          <SelectControl label="Type" value={typeFilter} onChange={setTypeFilter} options={ANOMALY_TYPE_OPTIONS} />
          <SelectControl label="Status" value={statusFilter} onChange={setStatusFilter} options={ANOMALY_STATUS_OPTIONS} />
          <ActionButton icon={X} onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}>Clear</ActionButton>
        </div>
      ) : null}
      <DataTable
        columns={['Employee', 'Type', 'Severity', 'Status', 'Detected', 'Details']}
        rows={filtered}
        loading={loading}
        emptyTitle="No anomalies"
        emptyText="No anomalies match the current filters."
        renderRow={(row) => (
          <>
            <td>
              <div className="person-cell">
                <span>{initialsFor(row)}</span>
                <b>{employeeName(row)}</b>
              </div>
            </td>
            <td>{safeText(row.anomalyType)}</td>
            <td><span className={`severity severity-${(row.severity || 'low').toLowerCase()}`}>{safeText(row.severity)}</span></td>
            <td>
              <span className={`status-pill ${row.status === 'RESOLVED' ? 'resolved' : 'open'}`}>
                {row.status === 'RESOLVED' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                {safeText(row.status)}
              </span>
            </td>
            <td>{formatDateTime(row.detectedAt)}</td>
            <td>{safeText(row.details)}</td>
          </>
        )}
      />
    </section>
  );
}
