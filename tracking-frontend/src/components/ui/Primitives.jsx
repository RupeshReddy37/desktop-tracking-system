import { LoaderCircle, X } from 'lucide-react';

export function ActionButton({ children, icon: Icon, variant = 'default', type = 'button', onClick, disabled, className = '' }) {
  return (
    <button type={type} className={`action-btn ${variant !== 'default' ? `action-${variant}` : ''} ${className}`.trim()} onClick={onClick} disabled={disabled}>
      {Icon ? <Icon size={15} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function IconButton({ icon: Icon, label, onClick, title }) {
  return (
    <button type="button" className="icon-btn" title={title || label} aria-label={label} onClick={onClick}>
      <Icon size={16} />
    </button>
  );
}

export function Field({ label, required, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}{required ? ' *' : ''}</span>
      {children}
    </label>
  );
}

export function SelectControl({ label, value, onChange, options }) {
  return (
    <label className="select-control">
      {label ? <span>{label}</span> : null}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

export function DatePickerControl({ value, onChange }) {
  return (
    <label className="date-control">
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function EmptyState({ title, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {text ? <p>{text}</p> : null}
      {actionLabel ? (
        <ActionButton variant="primary" onClick={onAction}>{actionLabel}</ActionButton>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading data' }) {
  return (
    <div className="loading-state">
      <LoaderCircle size={18} className="spin" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="error-banner">
      <span>{message}</span>
      {onDismiss ? (
        <button type="button" className="icon-btn" onClick={onDismiss} aria-label="Dismiss"><X size={14} /></button>
      ) : null}
    </div>
  );
}

export function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="toast">
      <span>{message}</span>
      <button type="button" className="icon-btn" onClick={onDismiss} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}

export function KpiCard({ icon: Icon, label, value, detail, tone = 'blue', percentValue }) {
  return (
    <section className={`kpi-card kpi-${tone}`}>
      <div className="kpi-icon"><Icon size={19} /></div>
      <div className="kpi-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
      {typeof percentValue === 'number' ? (
        <div className="kpi-bar"><span style={{ width: `${Math.min(100, Math.max(0, percentValue))}%` }} /></div>
      ) : null}
    </section>
  );
}

export function MetricPanel({ icon: Icon, title, value, text }) {
  return (
    <section className="metric-panel">
      <div className="metric-icon"><Icon size={19} /></div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <p>{text}</p>
      </div>
    </section>
  );
}

export function Panel({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`panel ${className}`.trim()}>
      {title || actions ? (
        <div className="panel-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
