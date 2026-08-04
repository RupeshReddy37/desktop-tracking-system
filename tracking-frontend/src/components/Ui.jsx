import React from 'react';
import { ICONS } from './Icons';
import { combineName, formatCompactDuration, formatDate, formatDateTime, formatExactDuration, formatNumber, formatRelativeTime, safeText, statusTone, confidenceTone } from '../lib/format';

export function Icon({ name, size = 18, className = '' }) {
  const Component = ICONS[name];
  if (!Component) {
    return null;
  }
  return <Component size={size} className={className} strokeWidth={1.8} />;
}

export function Button({ children, variant = 'default', size = 'md', onClick, type = 'button', disabled, icon, className = '', title }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`btn btn-${variant} btn-${size} ${className}`.trim()}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input"
      />
    </label>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <label className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <select value={value} onChange={onChange} className="input">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StatCard({ label, value, detail, accent, icon }) {
  return (
    <section className="stat-card">
      <div className={`stat-icon stat-${accent}`}>
        <Icon name={icon} size={18} />
      </div>
      <div className="stat-copy">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{formatNumber(value)}</div>
        <div className="stat-detail">{detail}</div>
      </div>
    </section>
  );
}

export function StatusPill({ status }) {
  return <span className={`pill ${statusTone(status)}`}>{safeText(status)}</span>;
}

export function ConfidencePill({ confidence }) {
  return <span className={`pill ${confidenceTone(confidence)}`}>{safeText(confidence)}</span>;
}

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <Icon name="ClipboardList" size={22} />
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel ? (
        <Button variant="primary" icon="RefreshCw" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading data' }) {
  return (
    <div className="loading-state">
      <Icon name="LoaderCircle" size={18} className="spin" />
      <span>{label}</span>
    </div>
  );
}

export function MetricLine({ label, value, tone = 'neutral' }) {
  return (
    <div className={`metric-line metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function RowAction({ icon, label, onClick, title }) {
  return (
    <button
      className="icon-btn"
      type="button"
      title={title || label}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

export function CopyChip({ label, value, onCopy }) {
  return (
    <div className="copy-chip">
      <div>
        <div className="copy-chip-label">{label}</div>
        <div className="copy-chip-value">{value}</div>
      </div>
      <button type="button" className="icon-btn" onClick={onCopy} title={`Copy ${label}`}>
        <Icon name="Copy" size={16} />
      </button>
    </div>
  );
}

export function DetailList({ items }) {
  return (
    <dl className="detail-list">
      {items.map((item) => (
        <React.Fragment key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

export function MiniStat({ label, value }) {
  return (
    <div className="mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Table({
  columns,
  rows,
  renderRow,
  emptyTitle,
  emptyDescription,
  loading,
  onRowClick,
  getRowKey
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.align === 'right' ? 'align-right' : ''}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey?.(row, index) ?? row.id ?? row.employeeId ?? row.detectedAt ?? row.applicationName ?? index} onClick={() => onRowClick?.(row)}>
              {renderRow(row)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function formatRowName(row) {
  return combineName(row.firstName, row.lastName);
}

export { formatCompactDuration, formatDate, formatDateTime, formatExactDuration, formatRelativeTime };
