import { EmptyState } from '../ui/Primitives';

const COLORS = {
  active: '#22c55e',
  idle: '#f59e0b',
  locked: '#a855f7',
  offline: '#ef4444'
};

export function TrendChart({ rows }) {
  if (!rows.length) {
    return <EmptyState title="No trend data" text="No usage rows were returned for this range." />;
  }

  const max = Math.max(...rows.map((row) => Math.max(row.active, row.idle, row.locked, row.offline)), 1);

  return (
    <div className="trend-chart">
      <div className="trend-bars">
        {rows.map((row) => (
          <div className="trend-column" key={row.key}>
            <div className="trend-stack">
              {['active', 'idle', 'locked', 'offline'].map((key) => (
                <div
                  key={key}
                  className="trend-segment"
                  style={{
                    height: `${Math.max(0, (row[key] / max) * 100)}%`,
                    backgroundColor: COLORS[key]
                  }}
                  title={`${key}: ${row[key]}s`}
                />
              ))}
            </div>
            <span className="trend-label">{row.label}</span>
          </div>
        ))}
      </div>
      <div className="trend-legend">
        {Object.entries(COLORS).map(([key, color]) => (
          <span key={key}><i style={{ backgroundColor: color }} />{key}</span>
        ))}
      </div>
    </div>
  );
}

export function StatusDonut({ counts }) {
  const total = Math.max(1, Number(counts?.total || 0));
  const segments = [
    { key: 'active', label: 'Active', value: Number(counts?.active || 0), color: COLORS.active },
    { key: 'idle', label: 'Idle', value: Number(counts?.idle || 0), color: COLORS.idle },
    { key: 'locked', label: 'Locked', value: Number(counts?.locked || 0), color: COLORS.locked },
    { key: 'offline', label: 'Offline', value: Number(counts?.offline || 0), color: COLORS.offline }
  ];

  let offset = 0;
  const circumference = 2 * Math.PI * 42;

  return (
    <section className="panel donut-panel">
      <div className="panel-head">
        <div>
          <h2>Status distribution</h2>
          <p>Share of employees by current status.</p>
        </div>
      </div>
      <div className="donut-wrap">
        <svg viewBox="0 0 100 100" className="donut">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="12" />
          {segments.map((segment) => {
            const dash = (segment.value / total) * circumference;
            const circle = (
              <circle
                key={segment.key}
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            );
            offset += dash;
            return circle;
          })}
          <text x="50" y="48" textAnchor="middle" className="donut-total">{counts?.total || 0}</text>
          <text x="50" y="60" textAnchor="middle" className="donut-caption">employees</text>
        </svg>
        <div className="donut-legend">
          {segments.map((segment) => (
            <span key={segment.key}>
              <i style={{ backgroundColor: segment.color }} />
              {segment.label} <b>{segment.value}</b>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CategoryDonut({ buckets }) {
  const total = Math.max(1, Number(buckets?.total || 0));
  const segments = [
    { key: 'Productive', label: 'Productive', value: Number(buckets?.Productive || 0), color: '#16a34a' },
    { key: 'Neutral', label: 'Neutral', value: Number(buckets?.Neutral || 0), color: '#f59e0b' },
    { key: 'Unproductive', label: 'Unproductive', value: Number(buckets?.Unproductive || 0), color: '#dc2626' },
    { key: 'Uncategorized', label: 'Uncategorized', value: Number(buckets?.Uncategorized || 0), color: '#6b7280' }
  ];

  let offset = 0;
  const circumference = 2 * Math.PI * 42;

  return (
    <section className="panel donut-panel">
      <div className="panel-head">
        <div>
          <h2>Category distribution</h2>
          <p>Share of tracked active time by app category.</p>
        </div>
      </div>
      <div className="donut-wrap">
        <svg viewBox="0 0 100 100" className="donut">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="12" />
          {segments.map((segment) => {
            const dash = (segment.value / total) * circumference;
            const circle = (
              <circle
                key={segment.key}
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            );
            offset += dash;
            return circle;
          })}
          <text x="50" y="48" textAnchor="middle" className="donut-total">{buckets?.total || 0}</text>
          <text x="50" y="60" textAnchor="middle" className="donut-caption">seconds</text>
        </svg>
        <div className="donut-legend">
          {segments.map((segment) => (
            <span key={segment.key}>
              <i style={{ backgroundColor: segment.color }} />
              {segment.label} <b>{Math.round((segment.value / total) * 100)}%</b>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ReportChart({ rows, mode }) {

  if (!rows.length) {
    return <EmptyState title="No chart data" text="No usage rows were returned for this range." />;
  }

  const max = Math.max(...rows.map((row) => Math.max(row.active, row.idle)), 1);

  if (mode === 'pie') {
    const total = rows.reduce((sum, row) => sum + row.active + row.idle, 0) || 1;
    return (
      <div className="report-pie">
        {rows.slice(0, 8).map((row, index) => {
          const value = row.active + row.idle;
          const color = Object.values(COLORS)[index % Object.values(COLORS).length];
          return (
            <div className="report-pie-row" key={row.key || index}>
              <i style={{ backgroundColor: color }} />
              <span>{row.label}</span>
              <b>{Math.round((value / total) * 100)}%</b>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="report-chart">
      <div className="report-bars">
        {rows.map((row) => (
          <div className="report-column" key={row.key || row.label}>
            <div className="report-stack">
              <div className="report-segment" style={{ height: `${Math.max(0, (row.active / max) * 100)}%`, backgroundColor: COLORS.active }} title={`active: ${row.active}s`} />
              <div className="report-segment" style={{ height: `${Math.max(0, (row.idle / max) * 100)}%`, backgroundColor: COLORS.idle }} title={`idle: ${row.idle}s`} />
            </div>
            <span className="report-label">{row.label}</span>
          </div>
        ))}
      </div>
      <div className="trend-legend">
        <span><i style={{ backgroundColor: COLORS.active }} />active</span>
        <span><i style={{ backgroundColor: COLORS.idle }} />idle</span>
      </div>
    </div>
  );
}
