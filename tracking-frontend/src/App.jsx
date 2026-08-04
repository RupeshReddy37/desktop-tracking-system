import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  ArrowUpDown,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Code2,
  Cpu,
  Download,
  Edit3,
  Eye,
  Filter,
  Home,
  LayoutDashboard,
  Lock,
  Monitor,
  MoreHorizontal,
  Power,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  SlidersHorizontal,
  UserPlus,
  Users,
  WifiOff,
  X
} from 'lucide-react';
import {
  createEmployee,
  getAnomalies,
  getApplicationUsage,
  getDailySummary,
  getDailyWindowUsage,
  getEmployeeProfile,
  getEmployeeAnomalies,
  getEmployees,
  getHomeDashboard
} from './lib/api';
import { combineName, formatCompactDuration, formatDate, formatDateTime, formatRelativeTime, safeText } from './lib/format';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'addEmployee', label: 'Add Employee', icon: UserPlus },
  { id: 'reports', label: 'Activity Reports', icon: ClipboardList },
  { id: 'anomalies', label: 'Anomaly Review', icon: ShieldAlert },
  { id: 'devices', label: 'Devices / Agents', icon: Monitor },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'api', label: 'API Console', icon: Code2 }
];

const trendModes = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' }
];

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function todayDate() {
  return isoDate(new Date());
}

function yesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return isoDate(date);
}

function daysAgoDate(days) {
  const date = new Date();
  date.setDate(date.getDate() - Number(days || 0));
  return isoDate(date);
}

function displayHeaderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date).replaceAll('/', '-');
}

function rangeForTrend(mode) {
  const end = new Date();
  const start = new Date();

  if (mode === 'week') {
    start.setDate(end.getDate() - 6);
  } else if (mode === 'month') {
    start.setDate(1);
  } else if (mode === 'year') {
    start.setMonth(0, 1);
  }

  return { startDate: isoDate(start), endDate: isoDate(end) };
}

function exportEmployeeSummaryRows(rows, { startDate = null, endDate = null, filenamePrefix = 'employee-summary' } = {}) {
  const rowsForCsv = [
    ['Employee Code', 'Name', 'Email', 'Active Time', 'Idle Time', 'Total Time', 'Days'],
    ...rows.map((row) => [
      row.employeeCode || row.employeeId || '-',
      employeeName(row),
      row.email || '-',
      formatCompactDuration(row.active || row.activeSecondsToday || row.activeSeconds || 0),
      formatCompactDuration(row.idle || row.idleSecondsToday || row.idleSeconds || 0),
      formatCompactDuration((Number(row.active || row.activeSecondsToday || row.activeSeconds || 0) + Number(row.idle || row.idleSecondsToday || row.idleSeconds || 0))),
      row.dayCount || 0
    ])
  ];

  const suffix = [
    startDate || 'start',
    endDate || 'end',
    'summary'
  ].join('-');
  exportRows(`${filenamePrefix}-${suffix}.csv`, rowsForCsv);
  return rows.length;
}

function exportEmployeeUsageRows(rows, { employeeLabel = 'employee', startDate = null, endDate = null, filenamePrefix = 'employee-candidate-report' } = {}) {
  const filtered = rows.filter((row) => {
    const usageDate = row.usageDate || row.createdAt || row.startedAt || row.lastSeenAt;
    const dateKey = usageDate ? isoDate(new Date(usageDate)) : '';
    if (startDate && dateKey < startDate) return false;
    if (endDate && dateKey > endDate) return false;
    return true;
  });

  const rowsForCsv = [
    ['Application', 'Process', 'Window Title', 'Document / File', 'Active', 'Idle'],
    ...filtered.map((row) => [
      row.applicationName || '-',
      row.processName || '-',
      row.windowTitle || '-',
      row.fileName || row.documentTitle || row.windowTitle || '-',
      formatCompactDuration(row.activeSeconds || row.activeSecondsToday || row.active || 0),
      formatCompactDuration(row.idleSeconds || row.idleSecondsToday || row.idle || 0)
    ])
  ];

  const suffix = [
    startDate || 'start',
    endDate || 'end',
    String(employeeLabel).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  ].join('-');
  exportRows(`${filenamePrefix}-${suffix}.csv`, rowsForCsv);
  return filtered.length;
}

function normalizeStatus(status) {
  return String(status || 'UNKNOWN').toUpperCase();
}

function statusClass(status) {
  return `status status-${normalizeStatus(status).toLowerCase().replace('_', '-')}`;
}

function isSeenToday(value) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? isoDate(date) === todayDate() : false;
}

function displayLastSeen(value) {
  if (!value) return 'Not seen yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not seen yet';
  return formatDateTime(value);
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / total) * 100);
}

function employeeName(row) {
  return combineName(row.firstName, row.lastName);
}

function initialsFor(row) {
  return employeeName(row)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'EM';
}

function groupTrendRows(rows, mode) {
  const map = new Map();

  rows.forEach((row) => {
    const rawDate = row.usageDate || row.date || row.createdAt || row.lastSeenAt;
    if (!rawDate) return;
    const date = new Date(rawDate);
    const key = isoDate(date);
    if (!map.has(key)) {
      map.set(key, { key, active: 0, idle: 0, locked: 0, offline: 0 });
    }
    const bucket = map.get(key);
    bucket.active += Number(row.activeSeconds || row.activeSecondsToday || 0);
    bucket.idle += Number(row.idleSeconds || row.idleSecondsToday || 0);
    bucket.locked += Number(row.lockedSecondsToday || 0);
    bucket.offline += Number(row.offlineSecondsToday || 0);
  });

  return [...map.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((row) => ({
      ...row,
      label: mode === 'day'
        ? 'Today'
        : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(row.key))
    }));
}

function consolidateUsage(rows, employeeBase = []) {
  const employees = new Map();
  const apps = new Map();
  const days = new Map();

  employeeBase.forEach((employee) => {
    const employeeKey = employee.employeeId || employee.employeeCode || employee.email || 'unknown';
    if (!employees.has(employeeKey)) {
      employees.set(employeeKey, {
        employeeId: employee.employeeId,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        active: 0,
        idle: 0,
        apps: new Set(),
        days: new Set()
      });
    }
  });

  rows.forEach((row) => {
    const employeeKey = row.employeeId || row.employeeCode || row.email || 'unknown';
    const appKey = row.applicationName || row.processName || 'Unknown app';
    const dayKey = row.usageDate || 'Unknown date';
    const active = Number(row.activeSeconds || 0);
    const idle = Number(row.idleSeconds || 0);

    if (!employees.has(employeeKey)) {
      employees.set(employeeKey, {
        employeeId: row.employeeId,
        employeeCode: row.employeeCode,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        active: 0,
        idle: 0,
        apps: new Set(),
        days: new Set()
      });
    }
    const employee = employees.get(employeeKey);
    employee.active += active;
    employee.idle += idle;
    employee.apps.add(appKey);
    employee.days.add(dayKey);

    if (!apps.has(appKey)) {
      apps.set(appKey, {
        applicationName: row.applicationName || appKey,
        processName: row.processName || '',
        active: 0,
        idle: 0,
        employees: new Set(),
        days: new Set()
      });
    }
    const app = apps.get(appKey);
    app.active += active;
    app.idle += idle;
    app.employees.add(employeeKey);
    app.days.add(dayKey);
    if (!app.processName && row.processName) {
      app.processName = row.processName;
    }

    if (!days.has(dayKey)) {
      days.set(dayKey, { key: dayKey, label: dayKey, active: 0, idle: 0 });
    }
    const day = days.get(dayKey);
    day.active += active;
    day.idle += idle;
  });

  const employeeRows = [...employees.values()]
    .map((row) => ({
      ...row,
      total: row.active + row.idle,
      appCount: row.apps.size,
      dayCount: row.days.size
    }))
    .sort((a, b) => b.total - a.total);

  const appRows = [...apps.values()]
    .map((row) => ({
      ...row,
      total: row.active + row.idle,
      employeeCount: row.employees.size
    }))
    .sort((a, b) => b.total - a.total);

  const dailyRows = [...days.values()]
    .sort((a, b) => String(a.key).localeCompare(String(b.key)))
    .map((row) => ({
      ...row,
      label: row.key === 'Unknown date'
        ? row.key
        : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(row.key))
    }));

  return { employeeRows, appRows, dailyRows };
}

function consolidateEmployeeSummary(rows, employeeBase = []) {
  const employees = new Map();
  const days = new Map();

  employeeBase.forEach((employee) => {
    const employeeKey = employeeLookupKey(employee);
    if (!employees.has(employeeKey)) {
      employees.set(employeeKey, {
        employeeId: employee.employeeId ?? employee.id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        active: 0,
        idle: 0,
        days: new Set()
      });
    }
  });

  rows.forEach((row) => {
    const employeeKey = employeeLookupKey(row);
    const usageDate = row.usageDate || 'Unknown date';
    const active = Number(row.activeSeconds || 0);
    const idle = Number(row.idleSeconds || 0);

    if (!employees.has(employeeKey)) {
      employees.set(employeeKey, {
        employeeId: row.employeeId,
        employeeCode: row.employeeCode,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        active: 0,
        idle: 0,
        days: new Set()
      });
    }

    const employee = employees.get(employeeKey);
    employee.active += active;
    employee.idle += idle;
    employee.days.add(usageDate);

    if (!days.has(usageDate)) {
      days.set(usageDate, { key: usageDate, active: 0, idle: 0 });
    }

    const day = days.get(usageDate);
    day.active += active;
    day.idle += idle;
  });

  const employeeRows = [...employees.values()]
    .map((row) => ({
      ...row,
      total: row.active + row.idle,
      dayCount: row.days.size
    }))
    .sort((a, b) => b.total - a.total);

  const dailyRows = [...days.values()]
    .sort((a, b) => String(a.key).localeCompare(String(b.key)))
    .map((row) => ({
      ...row,
      label: row.key === 'Unknown date'
        ? row.key
        : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(row.key))
    }));

  return { employeeRows, dailyRows };
}

const reportChartModes = [
  { id: 'bar', label: 'Bar graph' },
  { id: 'line', label: 'Line graph' },
  { id: 'xy', label: 'XY graph' },
  { id: 'histogram', label: 'Histogram' },
  { id: 'pie', label: 'Pie chart' }
];

function matchesEmployee(row, employee) {
  if (!employee) return false;
  const rowId = String(row.employeeId ?? row.id ?? '').trim();
  const employeeId = String(employee.employeeId ?? employee.id ?? '').trim();
  const employeeCode = String(employee.employeeCode ?? '').trim().toLowerCase();
  const rowCode = String(row.employeeCode ?? '').trim().toLowerCase();
  const employeeEmail = String(employee.email ?? '').trim().toLowerCase();
  const rowEmail = String(row.email ?? '').trim().toLowerCase();

  return (
    (rowId && employeeId && rowId === employeeId)
    || (employeeCode && rowCode && employeeCode === rowCode)
    || (employeeEmail && rowEmail && employeeEmail === rowEmail)
  );
}

function aggregateStatusTotals(rows) {
  return rows.reduce((acc, row) => {
    acc.active += Number(row.active || row.activeSeconds || row.activeSecondsToday || 0);
    acc.idle += Number(row.idle || row.idleSeconds || row.idleSecondsToday || 0);
    acc.locked += Number(row.locked || row.lockedSeconds || row.lockedSecondsToday || 0);
    acc.offline += Number(row.offline || row.offlineSeconds || row.offlineSecondsToday || 0);
    return acc;
  }, { active: 0, idle: 0, locked: 0, offline: 0 });
}

function displayWindowTitle(row) {
  return safeText(row.documentTitle || row.windowTitle || row.applicationName || row.processName || 'Window');
}

function splitLabel(value) {
  if (!value) return '-';
  const parts = String(value).split(/[\\\/]/).filter(Boolean);
  return parts[parts.length - 1] || value;
}

function employeeLookupKey(row) {
  return [
    String(row.employeeId ?? row.id ?? '').trim().toLowerCase(),
    String(row.employeeCode ?? '').trim().toLowerCase(),
    String(row.email ?? '').trim().toLowerCase()
  ].filter(Boolean).join('|');
}

function ChartModeTabs({ value, onChange }) {
  return (
    <div className="chart-mode-tabs" role="tablist" aria-label="Chart type">
      {reportChartModes.map((mode) => (
        <button
          key={mode.id}
          type="button"
          className={value === mode.id ? 'active' : ''}
          onClick={() => onChange(mode.id)}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

function ChartEmptyCanvas({ title, text }) {
  return (
    <div className="chart-empty">
      <div className="chart-grid">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="chart-empty-body">
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}

function ReportChartPanel({ title, description, rows, mode, onChangeMode, emptyTitle, emptyText }) {
  const totals = useMemo(() => aggregateStatusTotals(rows), [rows]);
  const totalTracked = totals.active + totals.idle + totals.locked + totals.offline;
  const chartRows = rows.length ? rows : [];
  const maxDay = Math.max(...chartRows.map((row) => (
    Number(row.active || 0)
    + Number(row.idle || 0)
    + Number(row.locked || 0)
    + Number(row.offline || 0)
  )), 1);
  const chartWidth = Math.max(420, chartRows.length * 82);

  function renderChart() {
    if (!chartRows.length) {
      return <ChartEmptyCanvas title={emptyTitle} text={emptyText} />;
    }

    if (mode === 'pie') {
      const total = Math.max(totalTracked, 1);
      const active = (totals.active / total) * 100;
      const idle = active + (totals.idle / total) * 100;
      const locked = idle + (totals.locked / total) * 100;
      const chart = `conic-gradient(#16b983 0 ${active}%, #f0a91f ${active}% ${idle}%, #7657f0 ${idle}% ${locked}%, #ef5d68 ${locked}% 100%)`;

      return (
        <div className="chart-pie-wrap">
          <div className="chart-pie" style={{ background: chart }}>
            <div>
              <strong>{formatCompactDuration(totalTracked)}</strong>
              <span>Total tracked</span>
            </div>
          </div>
          <div className="legend-grid legend-grid-inline">
            <span><i className="green" />Active <b>{formatCompactDuration(totals.active)}</b></span>
            <span><i className="amber" />Idle <b>{formatCompactDuration(totals.idle)}</b></span>
            <span><i className="purple" />Locked <b>{formatCompactDuration(totals.locked)}</b></span>
            <span><i className="red" />Offline <b>{formatCompactDuration(totals.offline)}</b></span>
          </div>
        </div>
      );
    }

    if (mode === 'xy') {
      const width = Math.max(440, chartRows.length * 84);
      const height = 260;
      const pad = 28;
      const xMax = Math.max(...chartRows.map((row) => Number(row.active || 0)), 1);
      const yMax = Math.max(...chartRows.map((row) => Number(row.idle || 0)), 1);
      return (
        <div className="chart-frame">
          <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg xy-chart" preserveAspectRatio="none">
            <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
            <line x1={pad} y1={pad} x2={pad} y2={height - pad} />
            {chartRows.map((row, index) => {
              const x = pad + ((Number(row.active || 0) / xMax) * (width - pad * 2));
              const y = (height - pad) - ((Number(row.idle || 0) / yMax) * (height - pad * 2));
              return <circle key={`${row.key}-${index}`} cx={x} cy={y} r="5" />;
            })}
          </svg>
        </div>
      );
    }

    if (mode === 'line') {
      const width = Math.max(440, chartRows.length * 84);
      const height = 260;
      const pad = 28;
      const series = (key) => chartRows.map((row, index) => {
        const x = chartRows.length === 1 ? width / 2 : pad + (index * (width - pad * 2)) / (chartRows.length - 1);
        const y = (height - pad) - ((Number(row[key] || 0) / maxDay) * (height - pad * 2));
        return `${x},${y}`;
      }).join(' ');
      return (
        <div className="chart-frame">
          <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg line-chart" preserveAspectRatio="none">
            <polyline className="series active" points={series('active')} />
            <polyline className="series idle" points={series('idle')} />
            {chartRows.map((row, index) => {
              const x = chartRows.length === 1 ? width / 2 : pad + (index * (width - pad * 2)) / (chartRows.length - 1);
              const y = (height - pad) - ((Number(row.active || 0) / maxDay) * (height - pad * 2));
              const yIdle = (height - pad) - ((Number(row.idle || 0) / maxDay) * (height - pad * 2));
              return (
                <React.Fragment key={`${row.key}-${index}`}>
                  <circle className="series-point active" cx={x} cy={y} r="4" />
                  <circle className="series-point idle" cx={x} cy={yIdle} r="4" />
                </React.Fragment>
              );
            })}
          </svg>
        </div>
      );
    }

    if (mode === 'histogram') {
      return (
        <div className="trend-chart histogram-chart">
          {chartRows.map((row) => {
            const total = Number(row.active || 0) + Number(row.idle || 0) + Number(row.locked || 0) + Number(row.offline || 0);
            const height = Math.max(8, (total / maxDay) * 165);
            return (
              <div className="trend-column" key={row.label}>
                <div className="trend-stack histogram-stack">
                  <span className="bar histogram" style={{ height }} />
                </div>
                <small>{row.label}</small>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="trend-chart">
        {chartRows.map((row) => {
          const activeHeight = Math.max(8, (Number(row.active || 0) / maxDay) * 160);
          const idleHeight = Math.max(5, (Number(row.idle || 0) / maxDay) * 160);
          const lockedHeight = Math.max(0, (Number(row.locked || 0) / maxDay) * 160);
          const offlineHeight = Math.max(0, (Number(row.offline || 0) / maxDay) * 160);
          return (
            <div className="trend-column" key={row.label}>
              <div className="trend-stack">
                <span className="bar offline" style={{ height: offlineHeight }} />
                <span className="bar locked" style={{ height: lockedHeight }} />
                <span className="bar idle" style={{ height: idleHeight }} />
                <span className="bar active" style={{ height: activeHeight }} />
              </div>
              <small>{row.label}</small>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className="panel report-section report-chart-panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <ChartModeTabs value={mode} onChange={onChangeMode} />
      </div>
      {chartRows.length ? (
        <>
          {renderChart()}
        </>
      ) : renderChart()}
    </section>
  );
}

function ExportRangeDialog({
  open,
  title,
  subtitle,
  fromDate,
  toDate,
  maxDate,
  onChangeFromDate,
  onChangeToDate,
  onClose,
  onConfirm
}) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="dialog-panel export-dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-head">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <IconButton icon={X} label="Close export dialog" onClick={onClose} />
        </div>
        <div className="dialog-grid">
          <Field label="From date">
            <DatePickerControl value={fromDate} onChange={onChangeFromDate} maxDate={maxDate} showToday={false} />
          </Field>
          <Field label="To date">
            <DatePickerControl value={toDate} onChange={onChangeToDate} maxDate={maxDate} showToday={false} />
          </Field>
        </div>
        <div className="dialog-actions">
          <ActionButton onClick={onClose}>Cancel</ActionButton>
          <ActionButton icon={Download} variant="primary" onClick={onConfirm}>Export</ActionButton>
        </div>
      </section>
    </div>
  );
}

function exportRows(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function IconButton({ icon: Icon, label, onClick, active = false }) {
  return (
    <button type="button" className={`icon-button ${active ? 'active' : ''}`} onClick={onClick} title={label}>
      <Icon size={17} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function ActionButton({ children, icon: Icon, variant = 'default', onClick, type = 'button', disabled = false }) {
  return (
    <button type={type} className={`action-button ${variant}`} onClick={onClick} disabled={disabled}>
      {Icon ? <Icon size={15} /> : null}
      <span>{children}</span>
    </button>
  );
}

function PageTabs({ tabs, value, onChange }) {
  return (
    <div className="page-tabs" role="tablist">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" className={value === tab.id ? 'active' : ''} onClick={() => onChange(tab.id)}>
          {tab.label}
          {tab.id === 'analytics' ? <span>New</span> : null}
        </button>
      ))}
    </div>
  );
}

function SelectControl({ label, value, onChange, options }) {
  return (
    <label className="select-control">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
      <ChevronDown size={15} />
    </label>
  );
}

function Field({ label, children, required = false }) {
  return (
    <label className="field">
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      {children}
    </label>
  );
}

function DatePickerControl({ value, onChange, minDate = null, maxDate = null, showToday = true }) {
  const [open, setOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState('days');
  const selected = new Date(value);
  const safeSelected = Number.isNaN(selected.getTime()) ? new Date() : selected;
  const [viewDate, setViewDate] = useState(() => new Date(safeSelected.getFullYear(), safeSelected.getMonth(), 1));
  const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(viewDate);
  const viewYear = viewDate.getFullYear();
  const currentYear = new Date().getFullYear();
  const monthNames = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(viewYear, index, 1)));
  const years = Array.from({ length: currentYear - 1990 + 1 }, (_, index) => currentYear - index);
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
  ];

  function shiftMonth(amount) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  function chooseMonth(monthIndex) {
    setViewDate((current) => new Date(current.getFullYear(), monthIndex, 1));
    setPickerMode('days');
  }

  function chooseYear(year) {
    setViewDate((current) => new Date(year, current.getMonth(), 1));
    setPickerMode('days');
  }

  function chooseDay(day) {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const nextIso = isoDate(next);
    if ((minDate && nextIso < minDate) || (maxDate && nextIso > maxDate)) return;
    onChange(nextIso);
    setOpen(false);
  }

  return (
    <div className="date-picker-wrap">
      <button type="button" className={`date-control ${open ? 'active' : ''}`} onClick={() => setOpen((current) => !current)}>
        <span>{displayHeaderDate(value)}</span>
        <CalendarDays size={17} />
      </button>
      {open ? (
        <div className="calendar-popover">
          <div className="calendar-head">
            <IconButton icon={ChevronLeft} label="Previous month" onClick={() => shiftMonth(-1)} />
            <div className="calendar-title">
              <button type="button" onClick={() => setPickerMode((mode) => mode === 'months' ? 'days' : 'months')}>{monthLabel}</button>
              <button type="button" onClick={() => setPickerMode((mode) => mode === 'years' ? 'days' : 'years')}>{viewYear}</button>
            </div>
            <IconButton icon={ChevronRight} label="Next month" onClick={() => shiftMonth(1)} />
          </div>
          {pickerMode === 'months' ? (
            <div className="calendar-month-grid">
              {monthNames.map((month, index) => (
                <button key={month} type="button" className={index === viewDate.getMonth() ? 'selected' : ''} onClick={() => chooseMonth(index)}>
                  {month}
                </button>
              ))}
            </div>
          ) : null}
          {pickerMode === 'years' ? (
            <div className="calendar-year-grid">
              {years.map((year) => (
                <button key={year} type="button" className={year === viewYear ? 'selected' : ''} onClick={() => chooseYear(year)}>
                  {year}
                </button>
              ))}
            </div>
          ) : null}
          {pickerMode === 'days' ? (
            <>
              <div className="calendar-weekdays">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
              </div>
              <div className="calendar-grid">
                {cells.map((day, index) => {
                  const dateValue = day ? isoDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) : '';
                  const disabled = Boolean((minDate && dateValue < minDate) || (maxDate && dateValue > maxDate));
                  return day ? (
                    <button
                      key={dateValue}
                      type="button"
                      className={dateValue === value ? 'selected' : dateValue === todayDate() ? 'today' : ''}
                      disabled={disabled}
                      onClick={() => chooseDay(day)}
                    >
                      {day}
                    </button>
                  ) : <span key={`empty-${index}`} />;
                })}
              </div>
            </>
          ) : null}
          {showToday ? (
            <button
              type="button"
              className="calendar-today"
              onClick={() => {
                const today = new Date();
                setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
                onChange(todayDate());
                setOpen(false);
              }}
            >
              Today
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, detail, tone, percentValue }) {
  return (
    <section className={`kpi-card ${tone}`}>
      <div className="kpi-topline">
        <div className="kpi-icon"><Icon size={19} /></div>
        <MoreHorizontal size={17} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <div className="kpi-footer">
        <small>{detail}</small>
        <i style={{ width: `${Math.max(8, percentValue || 0)}%` }} />
      </div>
    </section>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-panel">
      <ClipboardList size={24} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function DataTable({ columns, rows, renderRow }) {
  return (
    <div className="table-frame">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.employeeId || row.employeeCode || row.applicationName || row.usageDate || index}>{renderRow(row)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendChart({ rows, compact = false }) {
  const max = Math.max(...rows.map((row) => row.active + row.idle + row.locked + row.offline), 1);

  return (
    <div className={`trend-chart ${compact ? 'compact' : ''}`}>
      {rows.map((row) => {
        const activeHeight = Math.max(8, (row.active / max) * 160);
        const idleHeight = Math.max(5, (row.idle / max) * 160);
        const lockedHeight = Math.max(0, (row.locked / max) * 160);
        const offlineHeight = Math.max(0, (row.offline / max) * 160);
        return (
          <div className="trend-column" key={row.label}>
            <div className="trend-stack">
              <span className="bar offline" style={{ height: offlineHeight }} />
              <span className="bar locked" style={{ height: lockedHeight }} />
              <span className="bar idle" style={{ height: idleHeight }} />
              <span className="bar active" style={{ height: activeHeight }} />
            </div>
            <small>{row.label}</small>
          </div>
        );
      })}
    </div>
  );
}

function StatusDonut({ counts, compact = false }) {
  const total = Math.max(counts.total, 1);
  const active = percent(counts.active, total);
  const idle = percent(counts.idle, total);
  const locked = percent(counts.locked, total);
  const offline = percent(counts.offline, total);
  const chart = `conic-gradient(#16b983 0 ${active}%, #f0a91f ${active}% ${active + idle}%, #7657f0 ${active + idle}% ${active + idle + locked}%, #ef5d68 ${active + idle + locked}% ${active + idle + locked + offline}%, #e5ebf5 0)`;

  return (
    <section className={compact ? 'status-summary-compact' : 'panel status-panel'}>
      {compact ? null : (
        <div className="panel-head">
          <div>
            <h2>Status summary</h2>
            <p>Live split across all registered employees.</p>
          </div>
        </div>
      )}
      <div className="status-summary-grid">
        <div className="donut" style={{ background: chart }}>
          <div>
            <strong>{counts.total}</strong>
            <span>Employees</span>
          </div>
        </div>
        <div className="legend-grid">
          <span><i className="green" />Active <b>{counts.active}</b></span>
          <span><i className="amber" />Idle <b>{counts.idle}</b></span>
          <span><i className="purple" />Locked <b>{counts.locked}</b></span>
          <span><i className="red" />Offline <b>{counts.offline}</b></span>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [databaseEmployees, setDatabaseEmployees] = useState([]);
  const [counts, setCounts] = useState(null);
  const [trendMode, setTrendMode] = useState('week');
  const [reportMode, setReportMode] = useState('pie');
  const [reportStartDate, setReportStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return isoDate(date);
  });
  const [reportEndDate, setReportEndDate] = useState(yesterdayDate());
  const [trendRows, setTrendRows] = useState([]);
  const [reportSummaryRows, setReportSummaryRows] = useState([]);
  const [reportApplicationRows, setReportApplicationRows] = useState([]);
  const [anomalyRows, setAnomalyRows] = useState([]);
  const [selectedEmployeeRows, setSelectedEmployeeRows] = useState([]);
  const [selectedEmployeeRowsLoading, setSelectedEmployeeRowsLoading] = useState(false);
  const [selectedEmployeeRowsError, setSelectedEmployeeRowsError] = useState('');
  const [selectedEmployeeAnomalies, setSelectedEmployeeAnomalies] = useState([]);
  const [selectedEmployeeAnomaliesLoading, setSelectedEmployeeAnomaliesLoading] = useState(false);
  const [selectedEmployeeAnomaliesError, setSelectedEmployeeAnomaliesError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeDbFilter, setEmployeeDbFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reportView, setReportView] = useState('summary');
  const [selectedReportEmployee, setSelectedReportEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [error, setError] = useState('');
  const [anomalyError, setAnomalyError] = useState('');
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ employeeCode: '', firstName: '', lastName: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const title = navItems.find((item) => item.id === activeView)?.label || 'Dashboard';

  useEffect(() => {
    loadDashboard();
  }, [selectedDate]);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadTrend(trendMode);
  }, [trendMode]);

  useEffect(() => {
    loadReports();
    loadAnomalies();
  }, [reportStartDate, reportEndDate]);

  useEffect(() => {
    if (reportView !== 'detail' || !selectedReportEmployee) {
      setSelectedEmployeeRows([]);
      setSelectedEmployeeRowsError('');
      setSelectedEmployeeAnomalies([]);
      setSelectedEmployeeAnomaliesError('');
      return;
    }

    loadSelectedEmployeeRows(selectedReportEmployee);
    loadSelectedEmployeeAnomalies(selectedReportEmployee);
  }, [reportView, selectedReportEmployee, reportStartDate, reportEndDate]);

  async function loadDashboard() {
    setLoading(true);
    setError('');
    try {
      const data = await getHomeDashboard({
        page: 0,
        size: 100,
        sortBy: 'lastSeenAt',
        sortDirection: 'DESC',
        date: selectedDate
      });
      setEmployees(Array.isArray(data?.employees) ? data.employees : []);
      setCounts(data?.counts || null);
    } catch (err) {
      setEmployees([]);
      setCounts(null);
      setError(`Live data unavailable: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    setEmployeesLoading(true);
    try {
      const data = await getEmployees();
      setDatabaseEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setDatabaseEmployees([]);
      setToast(`Employee list unavailable: ${err.message}`);
    } finally {
      setEmployeesLoading(false);
    }
  }

  async function loadTrend(mode) {
    setTrendLoading(true);
    try {
      const rows = await getDailySummary({
        ...rangeForTrend(mode),
        page: 0,
        size: 500
      });
      setTrendRows(groupTrendRows(Array.isArray(rows) ? rows : [], mode));
    } catch {
      setTrendRows([]);
    } finally {
      setTrendLoading(false);
    }
  }

  async function loadReports() {
    setReportLoading(true);
    try {
      const [summaryRows, applicationRows] = await Promise.all([
        getDailySummary({
          startDate: reportStartDate,
          endDate: reportEndDate
        }),
        getApplicationUsage({
          startDate: reportStartDate,
          endDate: reportEndDate
        })
      ]);
      setReportSummaryRows(Array.isArray(summaryRows) ? summaryRows : []);
      setReportApplicationRows(Array.isArray(applicationRows) ? applicationRows : []);
    } catch {
      setReportSummaryRows([]);
      setReportApplicationRows([]);
    } finally {
      setReportLoading(false);
    }
  }

  async function loadAnomalies() {
    setAnomalyLoading(true);
    setAnomalyError('');
    try {
      const rows = await getAnomalies({
        startDate: reportStartDate,
        endDate: reportEndDate,
        page: 0,
        size: 200
      });
      setAnomalyRows(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setAnomalyRows([]);
      setAnomalyError(err.message);
    } finally {
      setAnomalyLoading(false);
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitEmployee(event) {
    event.preventDefault();
    if (!form.employeeCode || !form.firstName || !form.email) {
      setToast('Please fill employee code, first name, and email.');
      return;
    }

    setSaving(true);
    try {
      const created = await createEmployee(form);
      const createdCode = created?.employeeCode || form.employeeCode;
      setToast(`${createdCode} saved successfully. Employee list refreshed from server.`);
      setForm({ employeeCode: '', firstName: '', lastName: '', email: '' });
      setActiveView('employees');
      await Promise.all([loadDashboard(), loadEmployees()]);
    } catch (err) {
      setToast(`Create employee failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function openEmployeeProfile(employee) {
    const employeeWithId = { ...employee, employeeId: employee.employeeId || employee.id };
    setProfile(employeeWithId);
    if (!employeeWithId.employeeId) {
      setToast('Profile opened from dashboard row. Employee id was not returned by the API.');
      return;
    }

    setProfileLoading(true);
    try {
      const data = await getEmployeeProfile(employeeWithId.employeeId);
      setProfile({ ...employeeWithId, ...data });
    } catch (err) {
      setToast(`Profile opened from table row. Live profile failed: ${err.message}`);
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadSelectedEmployeeRows(employee) {
    if (!employee) {
      setSelectedEmployeeRows([]);
      setSelectedEmployeeRowsError('');
      return;
    }

    setSelectedEmployeeRowsLoading(true);
    setSelectedEmployeeRowsError('');
    try {
      const rows = await getDailyWindowUsage({
        employeeId: employee.employeeId || employee.id,
        employeeCode: employee.employeeCode,
        email: employee.email,
        startDate: reportStartDate,
        endDate: reportEndDate
      });
      setSelectedEmployeeRows(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setSelectedEmployeeRows([]);
      setSelectedEmployeeRowsError(err.message);
    } finally {
      setSelectedEmployeeRowsLoading(false);
    }
  }

  async function refreshReportsAndDetail() {
    await Promise.all([loadReports(), loadAnomalies()]);

    if (reportView === 'detail' && selectedReportEmployee) {
      await Promise.all([
        loadSelectedEmployeeRows(selectedReportEmployee),
        loadSelectedEmployeeAnomalies(selectedReportEmployee)
      ]);
    }
  }

  async function loadSelectedEmployeeAnomalies(employee) {
    if (!employee?.employeeId) {
      setSelectedEmployeeAnomalies([]);
      setSelectedEmployeeAnomaliesError('');
      return;
    }

    setSelectedEmployeeAnomaliesLoading(true);
    setSelectedEmployeeAnomaliesError('');
    try {
      const rows = await getEmployeeAnomalies(employee.employeeId, {
        startDate: reportStartDate,
        endDate: reportEndDate
      });
      setSelectedEmployeeAnomalies(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setSelectedEmployeeAnomalies([]);
      setSelectedEmployeeAnomaliesError(err.message);
    } finally {
      setSelectedEmployeeAnomaliesLoading(false);
    }
  }

  async function profileOperation(label, employee = profile) {
    if (label === 'Refresh profile') {
      if (!employee?.employeeId) {
        setToast('Profile refresh needs an employee id from the live API.');
        return;
      }

      setProfileLoading(true);
      try {
        const data = await getEmployeeProfile(employee.employeeId);
        setProfile({ ...employee, ...data });
        setToast(`${employeeName(employee)} profile refreshed.`);
      } catch (err) {
        setToast(`Profile refresh failed: ${err.message}`);
      } finally {
        setProfileLoading(false);
      }
      return;
    }

    if (label === 'Edit employee') {
      setToast('Edit needs an update endpoint. This server currently exposes create employee only.');
      return;
    }

    if (label === 'Deactivate employee') {
      setToast('Deactivate needs a backend endpoint before this action can be saved.');
      return;
    }

    setToast(`${label} selected.`);
  }

  const derivedCounts = useMemo(() => {
    if (counts) {
      return {
        total: counts.totalEmployees ?? employees.length,
        active: counts.activeEmployees ?? 0,
        idle: counts.idleEmployees ?? 0,
        locked: counts.lockedEmployees ?? 0,
        offline: counts.offlineEmployees ?? 0
      };
    }

    return employees.reduce(
      (acc, employee) => {
        acc.total += 1;
        const key = normalizeStatus(employee.currentStatus).toLowerCase();
        if (acc[key] !== undefined) acc[key] += 1;
        return acc;
      },
      { total: 0, active: 0, idle: 0, locked: 0, offline: 0 }
    );
  }, [counts, employees]);

  const filteredEmployees = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return employees;
    return employees.filter((employee) => [
      employee.employeeCode,
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.currentStatus
    ].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [employees, searchTerm]);

  const visibleEmployees = useMemo(() => {
    if (statusFilter === 'all') return filteredEmployees;
    return filteredEmployees.filter((employee) => normalizeStatus(employee.currentStatus) === statusFilter);
  }, [filteredEmployees, statusFilter]);

  const filteredDatabaseEmployees = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return databaseEmployees.filter((employee) => {
      if (employeeDbFilter === 'active' && employee.active !== true) return false;
      if (employeeDbFilter === 'inactive' && employee.active !== false) return false;
      if (!needle) return true;
      return [
      employee.employeeCode,
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.active,
      employee.createdAt,
      employee.updatedAt
      ].filter((value) => value !== undefined && value !== null).join(' ').toLowerCase().includes(needle);
    });
  }, [databaseEmployees, employeeDbFilter, searchTerm]);

  const consolidated = useMemo(
    () => consolidateEmployeeSummary(reportSummaryRows, databaseEmployees.length ? databaseEmployees : employees),
    [reportSummaryRows, databaseEmployees, employees]
  );

  const reportStats = useMemo(() => {
    const totalActive = reportSummaryRows.reduce((sum, row) => sum + Number(row.activeSeconds || 0), 0);
    const totalIdle = reportSummaryRows.reduce((sum, row) => sum + Number(row.idleSeconds || 0), 0);
    const total = totalActive + totalIdle;
    return {
      totalActive,
      totalIdle,
      total,
      employees: consolidated.employeeRows.length,
      applications: reportApplicationRows.length
    };
  }, [consolidated.employeeRows, reportApplicationRows, reportSummaryRows]);

  const productivity = useMemo(() => {
    const score = reportStats.total ? Math.round((reportStats.totalActive / Math.max(reportStats.total, 1)) * 100) : 0;
    return { ...reportStats, score };
  }, [reportStats]);

  function exportConsolidated() {
    exportEmployeeSummaryRows(consolidated.employeeRows, { filenamePrefix: 'employee-analytics' });
  }

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><LayoutDashboard size={21} /></div>
          <div>
            <strong>Work Day</strong>
            <span>Monitoring App</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link ${activeView === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-health">
          <div>
            <span className="pulse" />
            <strong>Live server</strong>
          </div>
          <p>{error ? 'Connection issue' : 'Connected'}</p>
          <b>{derivedCounts.active} active employees</b>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <div className="page-title">
              <span className="title-mark"><Users size={16} /></span>
              <div>
                <h1>{title}</h1>
              </div>
            </div>
          </div>

          <div className="command-bar">
            <label className="search-box">
              <Search size={16} />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search employees..." />
            </label>
            <DatePickerControl value={selectedDate} onChange={setSelectedDate} />
            <button type="button" className="notification-button" title="Notifications" aria-label="Notifications">
              <Bell size={21} />
            </button>
            <div className="user-chip">
              <span>MS</span>
              <div>
                <strong>Manager</strong>
                <small>Super Admin</small>
              </div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        {toast ? (
          <div className="toast">
            <CheckCircle2 size={15} />
            <span>{toast}</span>
            <button type="button" onClick={() => setToast('')} title="Dismiss"><X size={14} /></button>
          </div>
        ) : null}

        <section className="content-main full-width">
          {activeView === 'dashboard' ? (
            <DashboardView
              counts={derivedCounts}
              employees={visibleEmployees}
              loading={loading}
              error={error}
              refresh={loadDashboard}
              filtersOpen={filtersOpen}
              setFiltersOpen={setFiltersOpen}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              trendMode={trendMode}
              setTrendMode={setTrendMode}
              trendRows={trendRows}
              trendLoading={trendLoading}
              onViewProfile={openEmployeeProfile}
              productivity={productivity}
              consolidated={consolidated}
              selectedProfile={profile}
              profileLoading={profileLoading}
              onProfileOperation={profileOperation}
              onCloseProfile={() => {
                setProfile(null);
              }}
            />
          ) : null}
          {activeView === 'employees' ? (
            <EmployeesView
              employees={filteredDatabaseEmployees}
              loading={employeesLoading}
              onViewProfile={openEmployeeProfile}
              filtersOpen={filtersOpen}
              setFiltersOpen={setFiltersOpen}
              employeeDbFilter={employeeDbFilter}
              setEmployeeDbFilter={setEmployeeDbFilter}
            />
          ) : null}
          {activeView === 'addEmployee' ? (
            <AddEmployeeView form={form} updateForm={updateForm} submitEmployee={submitEmployee} saving={saving} />
          ) : null}
          {activeView === 'reports' ? (
            <ReportsView
              employees={employees}
              allEmployees={databaseEmployees}
              counts={derivedCounts}
              loading={loading}
              reportSummaryRows={reportSummaryRows}
              reportApplicationRows={reportApplicationRows}
              consolidated={consolidated}
              productivity={reportStats}
              reportLoading={reportLoading}
              reportStartDate={reportStartDate}
              reportEndDate={reportEndDate}
              setReportStartDate={setReportStartDate}
              setReportEndDate={setReportEndDate}
              reloadReports={refreshReportsAndDetail}
              anomalyRows={anomalyRows}
              anomalyLoading={anomalyLoading}
              anomalyError={anomalyError}
              reportView={reportView}
              selectedReportEmployee={selectedReportEmployee}
              setReportView={setReportView}
              setSelectedReportEmployee={setSelectedReportEmployee}
              profile={profile}
              profileLoading={profileLoading}
              onViewProfile={openEmployeeProfile}
              onProfileOperation={profileOperation}
              onCloseProfile={() => {
                setProfile(null);
                setSelectedReportEmployee(null);
                setReportView('summary');
              }}
              selectedEmployeeRows={selectedEmployeeRows}
              selectedEmployeeRowsLoading={selectedEmployeeRowsLoading}
              selectedEmployeeRowsError={selectedEmployeeRowsError}
              selectedEmployeeAnomalies={selectedEmployeeAnomalies}
              selectedEmployeeAnomaliesLoading={selectedEmployeeAnomaliesLoading}
              selectedEmployeeAnomaliesError={selectedEmployeeAnomaliesError}
              reportMode={reportMode}
              setReportMode={setReportMode}
            />
          ) : null}
          {activeView === 'anomalies' ? <AnomaliesView anomalies={anomalyRows} loading={anomalyLoading} error={anomalyError} reportRange={{ startDate: reportStartDate, endDate: reportEndDate }} onRefresh={loadAnomalies} onViewProfile={openEmployeeProfile} /> : null}
          {activeView === 'devices' ? <DevicesView employees={employees} /> : null}
          {activeView === 'settings' ? <SettingsView /> : null}
          {activeView === 'api' ? <ApiView /> : null}
        </section>

        {activeView !== 'dashboard' && activeView !== 'reports' ? (
          <ProfileDrawer
            profile={profile}
            loading={profileLoading}
            onClose={() => setProfile(null)}
            onOperation={profileOperation}
          />
        ) : null}
      </main>
    </div>
  );
}

function DashboardView({
  counts,
  employees,
  loading,
  error,
  refresh,
  filtersOpen,
  setFiltersOpen,
  statusFilter,
  setStatusFilter,
  trendMode,
  setTrendMode,
  trendRows,
  trendLoading,
  onViewProfile,
  productivity,
  selectedProfile,
  profileLoading,
  onProfileOperation,
  onCloseProfile
}) {
  return (
    <div className={`dashboard-shell ${selectedProfile ? 'has-profile' : ''}`}>
      <section className="dashboard-main">
        {error ? <div className="error-banner">{error}</div> : null}

          <section className="kpi-grid five">
            <KpiCard icon={Users} label="Total Employees" value={counts.total} detail="+12 vs yesterday" tone="blue" percentValue={100} />
            <KpiCard icon={Activity} label="Active" value={counts.active} detail={`${percent(counts.active, counts.total)}% of total`} tone="green" percentValue={percent(counts.active, counts.total)} />
            <KpiCard icon={Clock3} label="Idle" value={counts.idle} detail={`${percent(counts.idle, counts.total)}% of total`} tone="amber" percentValue={percent(counts.idle, counts.total)} />
            <KpiCard icon={Lock} label="Locked" value={counts.locked} detail={`${percent(counts.locked, counts.total)}% of total`} tone="purple" percentValue={percent(counts.locked, counts.total)} />
            <KpiCard icon={WifiOff} label="Offline" value={counts.offline} detail={`${percent(counts.offline, counts.total)}% of total`} tone="red" percentValue={percent(counts.offline, counts.total)} />
          </section>

          <section className="dashboard-grid">
            <section className="panel trend-box wide">
              <div className="panel-head">
                <div>
                  <h2>Activity trend</h2>
                  <p>Active, idle, locked, and offline time by selected range.</p>
                </div>
                <SelectControl label="Activity trend range" value={trendMode} onChange={setTrendMode} options={trendModes} />
              </div>
              {trendLoading ? (
                <EmptyState title="Loading trend" text="Reading live report data from the server." />
              ) : trendRows.length ? (
                <>
                  <TrendChart rows={trendRows} />
                  <div className="metric-ribbon">
                    <span>Total tracked <b>{formatCompactDuration(productivity.total)}</b></span>
                    <span>Active total <b>{formatCompactDuration(productivity.totalActive)}</b></span>
                    <span>Productivity <b>{productivity.score}/100</b></span>
                  </div>
                </>
              ) : (
                <EmptyState title="No trend data" text="No live usage rows were returned for this range." />
              )}
            </section>
            <StatusDonut counts={counts} />
          </section>

          <EmployeeTable
            rows={employees}
            loading={loading}
            onViewProfile={onViewProfile}
            filtersOpen={filtersOpen}
            setFiltersOpen={setFiltersOpen}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
      </section>

      {selectedProfile ? (
        <ProfilePanel
          profile={selectedProfile}
          loading={profileLoading}
          onOperation={onProfileOperation}
          onClose={onCloseProfile}
        />
      ) : null}
    </div>
  );
}

function AnalyticsPreview({ productivity, consolidated }) {
  const topApps = consolidated.appRows.slice(0, 5);
  return (
    <section className="analytics-grid">
      <MetricPanel icon={BarChart3} title="Consolidated active time" value={formatCompactDuration(productivity.totalActive)} text="Combined productive activity across employees." />
      <MetricPanel icon={Clock3} title="Consolidated idle time" value={formatCompactDuration(productivity.totalIdle)} text="Total idle time in the selected reporting window." />
      <MetricPanel icon={Activity} title="Productivity score" value={`${productivity.score}/100`} text={`${productivity.employees} employees and ${productivity.apps} apps represented.`} />
      <section className="panel span-two">
        <div className="panel-head">
          <div>
            <h2>Top applications</h2>
            <p>Highest consolidated usage by active + idle time.</p>
          </div>
        </div>
        {topApps.length ? <AppUsageList rows={topApps} /> : <EmptyState title="No application data" text="Open Activity Reports after usage rows are synced." />}
      </section>
    </section>
  );
}

function MetricPanel({ icon: Icon, title, value, text }) {
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

function LiveFeed({ employees }) {
  const recent = employees.slice(0, 6);
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Live feed</h2>
          <p>Recent employee sync and status events from the dashboard stream.</p>
        </div>
      </div>
      <div className="timeline-list">
        {recent.length ? recent.map((employee) => (
          <article key={employee.employeeId || employee.employeeCode}>
            <span className={statusClass(employee.currentStatus)}>{safeText(employee.currentStatus)}</span>
            <div>
              <strong>{employeeName(employee)}</strong>
              <p>{safeText(employee.employeeCode)} last seen {displayLastSeen(employee.lastSeenAt)}</p>
            </div>
          </article>
        )) : <EmptyState title="No feed events" text="Live events will appear after employees sync." />}
      </div>
    </section>
  );
}

const statusOptions = [
  { id: 'all', label: 'All statuses' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'IDLE', label: 'Idle' },
  { id: 'LOCKED', label: 'Locked' },
  { id: 'OFFLINE', label: 'Offline' }
];

const employeeDbOptions = [
  { id: 'all', label: 'All employees' },
  { id: 'active', label: 'Active employees' },
  { id: 'inactive', label: 'Inactive employees' }
];

function EmployeeTable({
  rows,
  loading,
  onViewProfile,
  filtersOpen,
  setFiltersOpen,
  statusFilter,
  setStatusFilter,
  variant = 'live',
  employeeDbFilter = 'all',
  setEmployeeDbFilter
}) {
  const isDatabaseTable = variant === 'database';
  const pageText = rows.length ? `Showing 1-${Math.min(rows.length, 10)} of ${rows.length}` : 'Showing 0 of 0';

  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <div>
          <h2>{isDatabaseTable ? 'Employees list' : <>Live Employees <span className="live-badge">Live</span></>}</h2>
        </div>
        <div className="panel-actions">
          <ActionButton icon={Filter} onClick={() => setFiltersOpen((value) => !value)}>Filters</ActionButton>
        </div>
      </div>
      {filtersOpen ? (
        <div className="filter-tray">
          {isDatabaseTable ? (
            <>
              <SelectControl label="Employee filter" value={employeeDbFilter} onChange={setEmployeeDbFilter} options={employeeDbOptions} />
              <ActionButton icon={X} onClick={() => setEmployeeDbFilter('all')}>Clear</ActionButton>
            </>
          ) : (
            <>
              <SelectControl label="Employee status filter" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
              <ActionButton icon={X} onClick={() => setStatusFilter('all')}>Clear</ActionButton>
            </>
          )}
        </div>
      ) : null}
      <div className="pagination-row">
        <span className="showing-count">{pageText}</span>
        <IconButton icon={ChevronLeft} label="Previous page" />
        <IconButton icon={ChevronRight} label="Next page" />
      </div>
      {loading ? (
        <EmptyState title="Loading employees" text={isDatabaseTable ? 'Reading employee records from the database.' : 'Reading live dashboard content from the server.'} />
      ) : rows.length ? (
        <DataTable
          columns={isDatabaseTable
            ? ['Employee ID', 'Employee Code', 'Name', 'Email', 'Active', 'Created', 'Updated', 'Actions']
            : ['Employee Code', 'Name', 'Email', 'Status', 'Active Today', 'Last Seen', 'Actions']}
          rows={rows}
          renderRow={(row) => isDatabaseTable ? (
            <>
              <td><strong>{safeText(row.id)}</strong></td>
              <td><strong>{safeText(row.employeeCode)}</strong></td>
              <td>
                <div className="person-cell">
                  <span>{initialsFor(row)}</span>
                  <b>{employeeName(row)}</b>
                </div>
              </td>
              <td>{safeText(row.email)}</td>
              <td>{row.active ? 'Yes' : 'No'}</td>
              <td>{formatDateTime(row.createdAt)}</td>
              <td>{formatDateTime(row.updatedAt)}</td>
              <td>
                <div className="row-actions">
                  <button type="button" title="View profile" onClick={() => onViewProfile(row)}><Eye size={14} />View</button>
                </div>
              </td>
            </>
          ) : (
            <>
              <td><strong>{safeText(row.employeeCode)}</strong></td>
              <td>
                <div className="person-cell">
                  <span>{initialsFor(row)}</span>
                  <b>{employeeName(row)}</b>
                </div>
              </td>
              <td>{safeText(row.email)}</td>
              <td><span className={statusClass(row.currentStatus)}>{safeText(row.currentStatus)}</span></td>
              <td>{formatCompactDuration(row.activeSecondsToday || row.activeSeconds || 0)}</td>
              <td>{displayLastSeen(row.lastSeenAt)}</td>
              <td>
                <div className="row-actions">
                  <button type="button" title="View profile" onClick={() => onViewProfile(row)}><Eye size={14} />View</button>
                </div>
              </td>
            </>
          )}
        />
      ) : (
        <EmptyState title="No employees found" text={isDatabaseTable ? 'No employee records match the current search.' : 'No employees match the current search or live API response.'} />
      )}
    </section>
  );
}

function EmployeesView({ employees, loading, onViewProfile, filtersOpen, setFiltersOpen, employeeDbFilter, setEmployeeDbFilter }) {
  return (
    <EmployeeTable
      rows={employees}
      loading={loading}
      onViewProfile={onViewProfile}
      filtersOpen={filtersOpen}
      setFiltersOpen={setFiltersOpen}
      variant="database"
      employeeDbFilter={employeeDbFilter}
      setEmployeeDbFilter={setEmployeeDbFilter}
    />
  );
}

function AddEmployeeView({ form, updateForm, submitEmployee, saving }) {
  return (
    <form className="panel form-panel elevated-form" onSubmit={submitEmployee}>
      <div className="form-intro">
        <div>
          <h2>Add employee</h2>
          <p>Fill all required * fields</p>
        </div>
        <ActionButton icon={UserPlus} variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Employee'}</ActionButton>
      </div>
      <div className="form-grid">
        <Field label="Employee Code" required><input value={form.employeeCode} onChange={(event) => updateForm('employeeCode', event.target.value)} placeholder="EMP012" /></Field>
        <Field label="First Name" required><input value={form.firstName} onChange={(event) => updateForm('firstName', event.target.value)} placeholder="Ananya" /></Field>
        <Field label="Last Name"><input value={form.lastName} onChange={(event) => updateForm('lastName', event.target.value)} placeholder="Roy" /></Field>
        <Field label="Email" required><input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="employee@company.com" /></Field>
      </div>
    </form>
  );
}

function ReportsView({
  employees,
  allEmployees = [],
  loading,
  reportSummaryRows = [],
  reportApplicationRows = [],
  consolidated,
  reportLoading,
  reportStartDate,
  reportEndDate,
  setReportStartDate,
  setReportEndDate,
  reloadReports,
  anomalyRows,
  anomalyLoading,
  anomalyError,
  reportView,
  selectedReportEmployee,
  setReportView,
  setSelectedReportEmployee,
  profile,
  profileLoading,
  onViewProfile,
  onProfileOperation,
  onCloseProfile,
  selectedEmployeeRows,
  selectedEmployeeRowsLoading,
  selectedEmployeeRowsError,
  selectedEmployeeAnomalies = [],
  selectedEmployeeAnomaliesLoading = false,
  selectedEmployeeAnomaliesError = '',
  reportMode,
  setReportMode
}) {
  const [searchText, setSearchText] = useState('');
  const [sortState, setSortState] = useState({ key: 'totalTracked', direction: 'desc' });
  const [page, setPage] = useState(0);
  const [exportDialog, setExportDialog] = useState(null);
  const [exportFromDate, setExportFromDate] = useState(reportStartDate);
  const [exportToDate, setExportToDate] = useState(reportEndDate);
  const pageSize = 8;
  const reportMaxDate = yesterdayDate();
  useEffect(() => {
    setPage(0);
  }, [searchText, reportStartDate, reportEndDate, sortState.key, sortState.direction]);

  const summaryRows = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    const rows = consolidated.employeeRows.filter((row) => {
      if (!needle) return true;
      return [row.employeeCode, employeeName(row), row.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });

    const sorted = [...rows].sort((a, b) => {
      const direction = sortState.direction === 'asc' ? 1 : -1;
      const leftActive = Number(a.active || 0);
      const rightActive = Number(b.active || 0);
      const leftIdle = Number(a.idle || 0);
      const rightIdle = Number(b.idle || 0);
      const leftTotal = Number(a.total || leftActive + leftIdle);
      const rightTotal = Number(b.total || rightActive + rightIdle);

      switch (sortState.key) {
        case 'name':
          return direction * employeeName(a).localeCompare(employeeName(b));
        case 'email':
          return direction * safeText(a.email).localeCompare(safeText(b.email));
        case 'activeTime':
          return direction * (leftActive - rightActive);
        case 'idleTime':
          return direction * (leftIdle - rightIdle);
        case 'totalTracked':
          return direction * (leftTotal - rightTotal);
        default:
          return 0;
      }
    });

    return sorted;
  }, [consolidated.employeeRows, searchText, sortState]);

  const filteredRows = summaryRows.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(summaryRows.length / pageSize));
  const appUsageRows = reportApplicationRows.slice(0, 5);
  const dailyRows = consolidated.dailyRows;

  function toggleSort(key) {
    setSortState((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  }

  function sortIcon(key) {
    if (sortState.key !== key) return <ArrowUpDown size={14} />;
    return sortState.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  }

  function openReportDetail(employee) {
    setSelectedReportEmployee(employee);
    setReportView('detail');
    onViewProfile(employee);
  }

  function closeReportDetail() {
    onCloseProfile();
    setSelectedReportEmployee(null);
    setReportView('summary');
  }

  function openExportDialog(kind) {
    setExportDialog(kind);
    setExportFromDate(reportStartDate);
    setExportToDate(reportEndDate);
  }

  function closeExportDialog() {
    setExportDialog(null);
  }

  function confirmExportDialog() {
    if (!exportDialog) return;
    if (exportFromDate > reportMaxDate || exportToDate > reportMaxDate) {
      setToast('Reports can only be downloaded up to yesterday.');
      return;
    }

    if (exportFromDate > exportToDate) {
      setToast('From date must be on or before To date.');
      return;
    }

    const count = exportDialog === 'detail'
      ? exportEmployeeUsageRows(selectedEmployeeRowsView, {
        employeeLabel: employeeLookupKey(selectedReportEmployee || {}),
        startDate: exportFromDate,
        endDate: exportToDate,
        filenamePrefix: 'employee-candidate-report'
      })
      : exportEmployeeSummaryRows(consolidated.employeeRows, {
        startDate: exportFromDate,
        endDate: exportToDate,
        filenamePrefix: 'employee-analytics'
      });
    setToast(`Downloaded ${count} rows.`);
    closeExportDialog();
  }

  const selectedEmployeeRowsView = useMemo(() => {
    if (!selectedReportEmployee) return [];
    return selectedEmployeeRows.filter((row) => matchesEmployee(row, selectedReportEmployee));
  }, [selectedEmployeeRows, selectedReportEmployee]);

  const selectedEmployeeConsolidated = useMemo(
    () => consolidateUsage(selectedEmployeeRowsView),
    [selectedEmployeeRowsView]
  );
  const exportDialogNode = (
    <ExportRangeDialog
      open={Boolean(exportDialog)}
      title={exportDialog === 'detail' ? 'Export employee report' : 'Export consolidated report'}
      subtitle={exportDialog === 'detail'
        ? `${employeeName(selectedReportEmployee)} · ${safeText(selectedReportEmployee?.employeeCode)}`
        : 'All employees in the selected range'}
      fromDate={exportFromDate}
      toDate={exportToDate}
      maxDate={reportMaxDate}
      onChangeFromDate={setExportFromDate}
      onChangeToDate={setExportToDate}
      onClose={closeExportDialog}
      onConfirm={confirmExportDialog}
    />
  );

  if (reportView === 'detail' && selectedReportEmployee) {
    return (
      <>
        <EmployeeReportDetailView
          employee={selectedReportEmployee}
          profile={profile}
          loading={profileLoading}
          reportStartDate={reportStartDate}
          reportEndDate={reportEndDate}
          reportMode={reportMode}
          setReportMode={setReportMode}
          reportLoading={reportLoading}
          selectedEmployeeRows={selectedEmployeeRowsView}
          selectedEmployeeRowsLoading={selectedEmployeeRowsLoading}
          selectedEmployeeRowsError={selectedEmployeeRowsError}
          consolidated={selectedEmployeeConsolidated}
          anomalyRows={selectedEmployeeAnomalies}
          anomalyLoading={selectedEmployeeAnomaliesLoading}
          anomalyError={selectedEmployeeAnomaliesError}
          onRefresh={reloadReports}
          onClose={closeReportDetail}
          onProfileOperation={onProfileOperation}
          onRequestExport={() => openExportDialog('detail')}
          setReportStartDate={setReportStartDate}
          setReportEndDate={setReportEndDate}
        />
        {exportDialogNode}
      </>
    );
  }

  return (
    <div className="reports-shell reports-summary-shell">
      <section className="reports-main">
      <section className="panel report-head">
          <div>
            <h2>Employee analytics</h2>
            <p>Summary, usage, and review items.</p>
          </div>
          <div className="report-actions">
            <ActionButton icon={RefreshCw} onClick={reloadReports}>Refresh</ActionButton>
            <ActionButton icon={Download} variant="primary" onClick={() => openExportDialog('summary')}>Export CSV</ActionButton>
          </div>
        </section>

        <section className="panel report-filters">
          <Field label="Employee code / email">
            <label className="search-box report-search">
              <Search size={16} />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search code or email"
              />
            </label>
          </Field>
          <Field label="From date">
            <DatePickerControl value={reportStartDate} onChange={setReportStartDate} maxDate={yesterdayDate()} showToday={false} />
          </Field>
          <Field label="To date">
            <DatePickerControl value={reportEndDate} onChange={setReportEndDate} maxDate={yesterdayDate()} showToday={false} />
          </Field>
        </section>

        <section className="panel table-panel">
          <div className="panel-head">
            <div>
              <h2>Consolidated employee summary</h2>
              <p>Totals grouped by employee.</p>
            </div>
            <span className="record-count">{summaryRows.length} employees</span>
          </div>
          <div className="pagination-row">
            <span className="showing-count">Showing {summaryRows.length ? page * pageSize + 1 : 0}-{Math.min((page + 1) * pageSize, summaryRows.length)} of {summaryRows.length}</span>
            <IconButton icon={ChevronLeft} label="Previous page" disabled={page <= 0} onClick={() => setPage((value) => Math.max(0, value - 1))} />
            <IconButton icon={ChevronRight} label="Next page" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} />
          </div>

          {loading ? (
            <EmptyState title="Loading employees" text="Reading consolidated rows for the selected range." />
          ) : reportLoading ? (
            <EmptyState title="Loading employees" text="Reading consolidated rows for the selected range." />
          ) : filteredRows.length ? (
            <div className="table-frame report-table-frame">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th><button type="button" onClick={() => toggleSort('name')}>Name {sortIcon('name')}</button></th>
                    <th><button type="button" onClick={() => toggleSort('email')}>Email {sortIcon('email')}</button></th>
                    <th><button type="button" onClick={() => toggleSort('activeTime')}>Active {sortIcon('activeTime')}</button></th>
                    <th><button type="button" onClick={() => toggleSort('idleTime')}>Idle {sortIcon('idleTime')}</button></th>
                    <th><button type="button" onClick={() => toggleSort('totalTracked')}>Total {sortIcon('totalTracked')}</button></th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const active = Number(row.active || 0);
                    const idle = Number(row.idle || 0);
                    return (
                      <tr key={row.employeeId || row.employeeCode}>
                        <td>
                          <strong>{safeText(row.employeeCode)}</strong>
                          <div className="table-subtext">{employeeName(row)}</div>
                        </td>
                        <td>{employeeName(row)}</td>
                        <td>{safeText(row.email)}</td>
                        <td>{formatCompactDuration(active)}</td>
                        <td>{formatCompactDuration(idle)}</td>
                        <td><strong>{formatCompactDuration(active + idle)}</strong></td>
                        <td>
                          <div className="row-actions">
                            <button type="button" onClick={() => openReportDetail(row)} title="View employee details">
                              <Eye size={14} />View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No employees found" text="Try changing the employee code or email search." />
          )}
        </section>

        <div className="reports-grid-two">
          <ReportChartPanel
            title="Daily activity trend"
            description="Daily totals."
            rows={dailyRows}
            mode={reportMode}
            onChangeMode={setReportMode}
            emptyTitle="No data"
            emptyText="No summary rows in this range."
          />
        </div>

        <section className="panel report-section">
          <div className="panel-head">
            <div>
              <h2>Application usage</h2>
              <p>Top applications in range.</p>
            </div>
            <span className="record-count">{appUsageRows.length} applications</span>
          </div>
          {appUsageRows.length ? (
            <div className="app-usage-report">
              <div className="chart-frame app-usage-visual">
                <AppUsageList rows={appUsageRows} />
              </div>
              <div className="table-frame report-table-frame report-table-scroll">
                <table className="analytics-table app-table">
                  <thead>
                    <tr>
                      <th>Application</th>
                      <th>Process</th>
                      <th>Active</th>
                      <th>Idle</th>
                      <th>Total</th>
                      <th>Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appUsageRows.map((row) => {
                      const total = Number(row.trackedSeconds || row.total || 0) || (Number(row.activeSeconds || row.active || 0) + Number(row.idleSeconds || row.idle || 0));
                      return (
                        <tr key={`${row.applicationName}-${row.processName || 'process'}`}>
                          <td><strong>{safeText(row.applicationName)}</strong></td>
                          <td>{safeText(row.processName)}</td>
                          <td>{formatCompactDuration(row.activeSeconds || row.active || 0)}</td>
                          <td>{formatCompactDuration(row.idleSeconds || row.idle || 0)}</td>
                          <td><strong>{formatCompactDuration(total)}</strong></td>
                          <td>{row.dayCount || row.days?.size || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <ChartEmptyCanvas title="No app usage" text="The selected range does not contain any application rows." />
          )}
        </section>

        <section className="panel report-section">
          <div className="panel-head">
            <div>
              <h2>Anomaly review</h2>
              <p>Review items for the selected range.</p>
            </div>
            <span className="record-count">{anomalyRows.length} items</span>
          </div>
          {anomalyLoading ? (
            <EmptyState title="Loading anomalies" text="Reading review items from the server." />
          ) : anomalyError ? (
            <div className="error-banner">Anomaly data unavailable: {anomalyError}</div>
          ) : anomalyRows.length ? (
            <div className="table-frame report-table-frame">
              <table className="analytics-table anomaly-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Detected at</th>
                    <th>Type</th>
                    <th>Confidence</th>
                    <th>Reason</th>
                    <th>Review status</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalyRows.map((row, index) => (
                    <tr key={`${row.employeeId || row.employeeCode || index}-${row.detectedAt || index}`}>
                      <td>
                        <strong>{safeText(row.employeeCode)}</strong>
                        <div className="table-subtext">{employeeName(row)}</div>
                      </td>
                      <td>{formatDateTime(row.detectedAt)}</td>
                      <td>{safeText(row.anomalyType)}</td>
                      <td><span className={`confidence ${String(row.confidence || '').toLowerCase()}`}>{safeText(row.confidence)}</span></td>
                      <td>{safeText(row.reasonSummary)}</td>
                      <td>{safeText(row.reviewStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No anomalies in range" text="The current selection returned no review items." />
          )}
        </section>
      </section>

      {exportDialogNode}
    </div>
  );
}

function EmployeeReportDetailView({
  employee,
  profile,
  loading,
  reportStartDate,
  reportEndDate,
  reportMode,
  setReportMode,
  setReportStartDate,
  setReportEndDate,
  reportLoading,
  selectedEmployeeRows,
  selectedEmployeeRowsLoading,
  selectedEmployeeRowsError,
  consolidated,
  anomalyRows,
  anomalyLoading = false,
  anomalyError = '',
  onRefresh,
  onClose,
  onProfileOperation,
  onRequestExport
}) {
  const appRows = consolidated.appRows.slice(0, 5);
  const trendRows = consolidated.dailyRows;
  const employeeProfile = profile || employee;
  const quickRanges = [1, 2, 3, 4];

  function applyQuickRange(days) {
    const daysCount = Math.max(1, Number(days || 1));
    setReportStartDate(daysAgoDate(daysCount));
    setReportEndDate(yesterdayDate());
  }

  function exportDetailCsv() {
    if (onRequestExport) onRequestExport();
  }

  return (
    <div className="reports-shell reports-detail-shell">
      <section className="reports-main">
        <section className="panel report-head detail-head">
          <div>
            <h2>Employee report</h2>
            <p>{employeeName(employee)} · {safeText(employee.employeeCode)} · Range {formatDate(reportStartDate)} - {formatDate(reportEndDate)}</p>
          </div>
          <div className="report-actions">
            <ActionButton icon={ChevronLeft} onClick={onClose}>Back to summary</ActionButton>
            <ActionButton icon={RefreshCw} onClick={onRefresh}>Refresh</ActionButton>
            <ActionButton icon={Download} variant="primary" onClick={exportDetailCsv}>Export CSV</ActionButton>
          </div>
        </section>

        <section className="panel quick-range-strip">
          <div>
            <strong>Quick range</strong>
            <p>Short ranges for a single employee.</p>
          </div>
          <div className="quick-range-buttons">
            {quickRanges.map((days) => {
              const active = formatDate(reportStartDate) === formatDate(daysAgoDate(days)) && formatDate(reportEndDate) === formatDate(yesterdayDate());
              return (
                <button
                  key={days}
                  type="button"
                  className={active ? 'active' : ''}
                  onClick={() => applyQuickRange(days)}
                >
                  {days} day{days > 1 ? 's' : ''}
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel detail-summary-strip">
          <div>
            <span>Rows</span>
            <strong>{selectedEmployeeRows.length}</strong>
          </div>
          <div>
            <span>Applications</span>
            <strong>{consolidated.appRows.length}</strong>
          </div>
          <div>
            <span>Days</span>
            <strong>{consolidated.dailyRows.length}</strong>
          </div>
          <div>
            <span>Review items</span>
            <strong>{anomalyRows.length}</strong>
          </div>
        </section>

        <div className="reports-grid-two">
          <ReportChartPanel
            title="Daily activity trend"
            description="Daily totals."
            rows={trendRows}
            mode={reportMode}
            onChangeMode={setReportMode}
            emptyTitle="No data"
            emptyText="No summary rows for this employee."
          />

          <section className="panel report-insight-panel">
            <div className="panel-head">
              <div>
                <h2>Usage snapshot</h2>
                <p>Top apps and totals.</p>
              </div>
            </div>
            <div className="detail-range-note">Showing {formatDate(reportStartDate)} to {formatDate(reportEndDate)}</div>
            <div className="insight-grid">
              <div>
                <span>Top app</span>
                <strong>{appRows[0]?.applicationName || 'No usage'}</strong>
                <small>{formatCompactDuration(appRows[0]?.total || 0)}</small>
              </div>
              <div>
                <span>Rows</span>
                <strong>{selectedEmployeeRows.length}</strong>
                <small>Within selected range</small>
              </div>
              <div>
                <span>Apps</span>
                <strong>{consolidated.appRows.length}</strong>
                <small>Top rows below</small>
              </div>
              <div>
                <span>Review items</span>
                <strong>{anomalyRows.length}</strong>
                <small>Open anomalies</small>
              </div>
            </div>
          </section>
        </div>

        <section className="panel report-section">
          <div className="panel-head">
            <div>
              <h2>Window usage</h2>
              <p>App, process, title, file.</p>
            </div>
            <span className="record-count">{appRows.length} applications</span>
          </div>

          {selectedEmployeeRowsLoading ? (
            <EmptyState title="Loading employee details" text="Reading selected employee usage rows from the server." />
          ) : selectedEmployeeRowsError ? (
            <div className="error-banner">Employee detail unavailable: {selectedEmployeeRowsError}</div>
          ) : appRows.length ? (
            <div className="app-usage-report detail-app-usage">
              <div className="chart-frame app-usage-visual">
                <AppUsageList rows={appRows} />
              </div>
              <div className="table-frame report-table-frame report-table-scroll">
                <table className="analytics-table app-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Application</th>
                      <th>Process</th>
                      <th>Window title</th>
                      <th>File / document</th>
                      <th>Active</th>
                      <th>Idle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployeeRows.map((row, index) => {
                      return (
                        <tr key={`${row.applicationName || 'app'}-${row.usageDate || index}-${index}`}>
                          <td>{formatDate(row.usageDate)}</td>
                          <td><strong>{safeText(row.applicationName)}</strong></td>
                          <td>{safeText(row.processName)}</td>
                          <td>{safeText(row.windowTitle)}</td>
                          <td>{safeText(row.fileName || row.documentTitle || displayWindowTitle(row))}</td>
                          <td>{formatCompactDuration(row.activeSeconds || row.active || 0)}</td>
                          <td>{formatCompactDuration(row.idleSeconds || row.idle || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <ChartEmptyCanvas title="No window detail" text="The selected employee has no window rows in the range." />
          )}
        </section>

        <section className="panel report-section">
          <div className="panel-head">
            <div>
              <h2>Anomaly review</h2>
              <p>Selected range review items.</p>
            </div>
            <span className="record-count">{anomalyRows.length} items</span>
          </div>
          {anomalyLoading ? (
            <EmptyState title="Loading review data" text="Reading employee-specific review items from the server." />
          ) : anomalyError ? (
            <div className="error-banner">Employee anomaly data unavailable: {anomalyError}</div>
          ) : reportLoading ? (
            <EmptyState title="Loading review data" text="Reading anomaly and usage rows from the server." />
          ) : anomalyRows.length ? (
            <div className="table-frame report-table-frame">
              <table className="analytics-table anomaly-table">
                <thead>
                  <tr>
                    <th>Detected at</th>
                    <th>Type</th>
                    <th>Confidence</th>
                    <th>Reason</th>
                    <th>Review status</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalyRows.map((row, index) => (
                    <tr key={`${row.detectedAt || index}-${index}`}>
                      <td>{formatDateTime(row.detectedAt)}</td>
                      <td>{safeText(row.anomalyType)}</td>
                      <td><span className={`confidence ${String(row.confidence || '').toLowerCase()}`}>{safeText(row.confidence)}</span></td>
                      <td>{safeText(row.reasonSummary)}</td>
                      <td>{safeText(row.reviewStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No anomalies in range" text="This employee has no anomaly review items for the selected range." />
          )}
        </section>
      </section>

      <aside className="report-inspector report-detail-inspector">
        <ProfilePanel
          profile={employeeProfile}
          loading={loading}
          onOperation={onProfileOperation}
          onClose={onClose}
        />
      </aside>
    </div>
  );
}

function AppUsageList({ rows }) {
  const max = Math.max(...rows.map((row) => Number(row.total || row.trackedSeconds || row.activeSeconds || 0)), 1);
  return (
    <div className="app-usage-list">
      {rows.map((row) => (
        <article key={`${row.applicationName}-${row.processName || 'process'}`}>
          <div>
            <strong>{row.applicationName}</strong>
            <span>{row.employeeCount || row.dayCount || 0} rows | {formatCompactDuration(row.total || row.trackedSeconds || row.activeSeconds || 0)}</span>
          </div>
          <i><b style={{ width: `${Math.max(7, ((row.total || row.trackedSeconds || row.activeSeconds || 0) / max) * 100)}%` }} /></i>
        </article>
      ))}
    </div>
  );
}

function ProfilePanel({ profile, loading, onOperation, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!profile) {
    return (
      <aside className="profile-panel">
        <div className="drawer-head">
          <h2>Employee Profile</h2>
        </div>
        <EmptyState title="No employee selected" text="Select View from the live employee table." />
      </aside>
    );
  }

  const status = profile.currentStatus || (profile.active === false ? 'OFFLINE' : 'ACTIVE');
  const activeToday = Number(profile.activeSecondsToday || 0);
  const idleToday = Number(profile.idleSecondsToday || 0);
  const lockedToday = Number(profile.lockedSecondsToday || 0);
  const offlineToday = Number(profile.offlineSecondsToday || 0);
  const score = activeToday + idleToday ? Math.round((activeToday / Math.max(activeToday + idleToday, 1)) * 100) : 0;

  return (
    <aside className="profile-panel">
      <div className="profile-panel-head">
        <h2>Employee Profile</h2>
        <IconButton icon={X} label="Close profile" onClick={onClose} />
      </div>

      <div className="profile-identity">
        <span className="rail-avatar">{initialsFor(profile)}</span>
        <div>
          <div className="identity-line">
            <h3>{employeeName(profile)}</h3>
            <span className={statusClass(status)}>{safeText(status)}</span>
          </div>
          <p>{safeText(profile.employeeCode)} | {safeText(status)}</p>
          <p>{safeText(profile.email)}</p>
        </div>
      </div>

      <PageTabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'activity', label: 'Activity' },
          { id: 'devices', label: 'Devices' },
          { id: 'settings', label: 'Settings' }
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {loading ? <div className="drawer-loading">Loading latest profile...</div> : null}

      {activeTab === 'overview' ? (
      <>
      <div className="profile-info-list">
        <ProfileInfo label="Employee ID" value={profile.employeeId || profile.id || '-'} />
        <ProfileInfo label="Employee Code" value={profile.employeeCode} />
        <ProfileInfo label="Email" value={profile.email} />
        <ProfileInfo label="Created at" value={formatDateTime(profile.createdAt)} />
        <ProfileInfo label="Updated at" value={formatDateTime(profile.updatedAt)} />
        <ProfileInfo label="Last seen" value={displayLastSeen(profile.lastSeenAt)} />
      </div>

      <section className="profile-score-card">
        <div>
          <span>Active Today</span>
          <strong>{formatCompactDuration(activeToday)}</strong>
          <i />
        </div>
        <div>
          <span>Productivity Score</span>
          <strong>{score || 0}<small> /100</small></strong>
        </div>
      </section>

      <section className="profile-mini-grid-wrap">
        <div className="profile-mini-grid">
          <ProfileInfo label="Idle today" value={formatCompactDuration(idleToday)} />
          <ProfileInfo label="Locked today" value={formatCompactDuration(lockedToday)} />
          <ProfileInfo label="Offline today" value={formatCompactDuration(offlineToday)} />
        </div>
      </section>

      <section className="quick-actions-card">
        <h3>Quick Actions</h3>
        <div className="quick-action-grid">
          <ActionButton icon={RefreshCw} onClick={() => onOperation('Refresh profile', profile)}>Refresh Profile</ActionButton>
          <ActionButton icon={Edit3} onClick={() => onOperation('Edit employee', profile)}>Edit Employee</ActionButton>
        </div>
        <ActionButton icon={Power} variant="outline-danger" onClick={() => onOperation('Deactivate employee', profile)}>Deactivate Employee</ActionButton>
      </section>

      <section className="profile-footer-card">
        <div>
          <span>Last Seen</span>
          <strong>{displayLastSeen(profile.lastSeenAt)}</strong>
        </div>
        <div>
          <span>Hostname</span>
          <strong>{safeText(profile.hostname || profile.deviceId || '-')}</strong>
        </div>
      </section>
      </>
      ) : null}
        {activeTab === 'activity' ? (
          <section className="quick-actions-card">
            <h3>Activity</h3>
            <div className="profile-mini-grid">
              <ProfileInfo label="Active today" value={formatCompactDuration(activeToday)} />
              <ProfileInfo label="Idle today" value={formatCompactDuration(idleToday)} />
              <ProfileInfo label="Locked today" value={formatCompactDuration(lockedToday)} />
              <ProfileInfo label="Last seen" value={displayLastSeen(profile.lastSeenAt)} />
            </div>
          </section>
        ) : null}
      {activeTab === 'devices' ? (
        <section className="quick-actions-card">
          <h3>Devices</h3>
          <div className="profile-mini-grid">
            <ProfileInfo label="Device" value={profile.hostname || profile.deviceId || 'Not registered'} />
            <ProfileInfo label="Agent" value={profile.agentVersion || '-'} />
            <ProfileInfo label="OS" value={profile.operatingSystem || '-'} />
          </div>
        </section>
      ) : null}
      {activeTab === 'settings' ? (
        <section className="quick-actions-card">
          <h3>Settings</h3>
          <ActionButton icon={RefreshCw} onClick={() => onOperation('Refresh profile', profile)}>Refresh Profile</ActionButton>
        </section>
      ) : null}
    </aside>
  );
}

function ProfileInfo({ label, value }) {
  return (
    <div className="profile-info-row">
      <span>{label}</span>
      <strong>{safeText(value)}</strong>
    </div>
  );
}

function ProfileDrawer({ profile, loading, onClose, onOperation }) {
  const [activeTab, setActiveTab] = useState('overview');
  if (!profile) return null;

  const status = profile.currentStatus || (profile.active === false ? 'OFFLINE' : 'ACTIVE');

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="profile-drawer" role="dialog" aria-modal="true" aria-label="Employee profile" onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-head">
          <div className="profile-title">
            <span className="rail-avatar">{initialsFor(profile)}</span>
            <div>
              <h2>{employeeName(profile)}</h2>
              <p>{safeText(profile.employeeCode)} | {safeText(profile.email)}</p>
            </div>
          </div>
          <IconButton icon={X} label="Close profile" onClick={onClose} />
        </div>

        <PageTabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'activity', label: 'Activity' },
            { id: 'devices', label: 'Devices' },
            { id: 'settings', label: 'Settings' }
        ]}
          value={activeTab}
          onChange={setActiveTab}
        />

        {loading ? <div className="drawer-loading">Loading latest profile...</div> : null}

        {activeTab === 'overview' ? (
        <>
        <div className="profile-status-row">
          <span className={statusClass(status)}>{safeText(status)}</span>
          <span>{displayLastSeen(profile.lastSeenAt)}</span>
        </div>

        <dl className="detail-list">
          <div><dt>Employee ID</dt><dd>{safeText(profile.employeeId || profile.id)}</dd></div>
          <div><dt>Employee Code</dt><dd>{safeText(profile.employeeCode)}</dd></div>
          <div><dt>Email</dt><dd>{safeText(profile.email)}</dd></div>
          <div><dt>Created</dt><dd>{formatDateTime(profile.createdAt)}</dd></div>
          <div><dt>Updated</dt><dd>{formatDateTime(profile.updatedAt)}</dd></div>
          <div><dt>Active today</dt><dd>{formatCompactDuration(profile.activeSecondsToday || 0)}</dd></div>
          <div><dt>Idle today</dt><dd>{formatCompactDuration(profile.idleSecondsToday || 0)}</dd></div>
          <div><dt>Locked today</dt><dd>{formatCompactDuration(profile.lockedSecondsToday || 0)}</dd></div>
          <div><dt>Offline today</dt><dd>{formatCompactDuration(profile.offlineSecondsToday || 0)}</dd></div>
        </dl>

        <section className="drawer-section">
          <h3>Device / Agent</h3>
          <dl className="detail-list single">
            <div><dt>Device ID</dt><dd>{safeText(profile.deviceId || profile.agentDeviceId)}</dd></div>
            <div><dt>Hostname</dt><dd>{safeText(profile.hostname)}</dd></div>
            <div><dt>Operating system</dt><dd>{safeText(profile.operatingSystem)}</dd></div>
            <div><dt>Agent version</dt><dd>{safeText(profile.agentVersion)}</dd></div>
          </dl>
        </section>

        <section className="drawer-section action-zone">
          <h3>Quick actions</h3>
          <div className="drawer-actions">
            <ActionButton icon={RefreshCw} onClick={() => onOperation('Refresh profile')}>Refresh</ActionButton>
            <ActionButton icon={Edit3} onClick={() => onOperation('Edit employee')}>Edit</ActionButton>
            <ActionButton icon={Power} variant="danger" onClick={() => onOperation('Deactivate employee')}>Deactivate</ActionButton>
          </div>
        </section>
        </>
        ) : null}
        {activeTab === 'activity' ? (
          <section className="drawer-section action-zone">
            <h3>Activity</h3>
            <dl className="detail-list single">
              <div><dt>Active today</dt><dd>{formatCompactDuration(profile.activeSecondsToday || 0)}</dd></div>
              <div><dt>Idle today</dt><dd>{formatCompactDuration(profile.idleSecondsToday || 0)}</dd></div>
              <div><dt>Locked today</dt><dd>{formatCompactDuration(profile.lockedSecondsToday || 0)}</dd></div>
              <div><dt>Last seen</dt><dd>{displayLastSeen(profile.lastSeenAt)}</dd></div>
            </dl>
          </section>
        ) : null}
        {activeTab === 'devices' ? (
          <section className="drawer-section action-zone">
            <h3>Device / Agent</h3>
            <dl className="detail-list single">
              <div><dt>Device ID</dt><dd>{safeText(profile.deviceId || profile.agentDeviceId)}</dd></div>
              <div><dt>Hostname</dt><dd>{safeText(profile.hostname)}</dd></div>
              <div><dt>Operating system</dt><dd>{safeText(profile.operatingSystem)}</dd></div>
              <div><dt>Agent version</dt><dd>{safeText(profile.agentVersion)}</dd></div>
            </dl>
          </section>
        ) : null}
        {activeTab === 'settings' ? (
          <section className="drawer-section action-zone">
            <h3>Profile settings</h3>
            <div className="drawer-actions">
              <ActionButton icon={RefreshCw} onClick={() => onOperation('Refresh profile', profile)}>Refresh</ActionButton>
              <ActionButton icon={Edit3} onClick={() => onOperation('Edit employee', profile)}>Edit</ActionButton>
              <ActionButton icon={Power} variant="danger" onClick={() => onOperation('Deactivate employee', profile)}>Deactivate</ActionButton>
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function AnomaliesView({ anomalies = [], loading = false, error = '', reportRange = null, onRefresh, onViewProfile }) {
  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <div>
          <h2>Anomaly review</h2>
          <p>{reportRange ? `Selected range: ${formatDate(reportRange.startDate)} - ${formatDate(reportRange.endDate)}` : 'Review confidence, reason, and resolution status from the server.'}</p>
        </div>
        <ActionButton icon={RefreshCw} onClick={onRefresh}>Refresh</ActionButton>
      </div>
      {loading ? (
        <EmptyState title="Loading anomalies" text="Reading review items from the server." />
      ) : error ? (
        <div className="error-banner">Anomaly data unavailable: {error}</div>
      ) : anomalies.length ? (
        <div className="table-frame report-table-frame">
          <table className="analytics-table anomaly-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Detected at</th>
                <th>Type</th>
                <th>Confidence</th>
                <th>Reason</th>
                <th>Review status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((row, index) => (
                <tr key={`${row.employeeId || row.employeeCode || index}-${row.detectedAt || index}`}>
                  <td>
                    <strong>{safeText(row.employeeCode)}</strong>
                    <div className="table-subtext">{employeeName(row)}</div>
                  </td>
                  <td>{formatDateTime(row.detectedAt)}</td>
                  <td>{safeText(row.anomalyType)}</td>
                  <td><span className={`confidence ${String(row.confidence || '').toLowerCase()}`}>{safeText(row.confidence)}</span></td>
                  <td>{safeText(row.reasonSummary)}</td>
                  <td>{safeText(row.reviewStatus)}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" onClick={() => onViewProfile?.(row)} title="Open profile">
                        <Eye size={14} />Open
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No anomalies in range" text="The current selection returned no review items." />
      )}
    </section>
  );
}

function DevicesView({ employees }) {
  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <div>
          <h2>Registered devices</h2>
          <p>Agent version, sync health, and device ownership.</p>
        </div>
        <ActionButton icon={Cpu}>Health Scan</ActionButton>
      </div>
      <DataTable
        columns={['Employee', 'Device', 'Agent Version', 'Last Sync', 'Health']}
        rows={employees.slice(0, 6)}
        renderRow={(row) => (
          <>
            <td>{employeeName(row)}</td>
            <td>{safeText(row.hostname || row.deviceId || 'Not registered')}</td>
            <td>{safeText(row.agentVersion || '1.0.0')}</td>
            <td>{displayLastSeen(row.lastSeenAt)}</td>
            <td><span className="health-healthy">Healthy</span></td>
          </>
        )}
      />
    </section>
  );
}

function SettingsView() {
  return (
    <section className="settings-grid">
      {[
        ['Company profile', 'Timezone, business hours, and manager access.'],
        ['Activity thresholds', 'Idle limits, offline windows, and anomaly confidence.'],
        ['Notifications', 'Digest frequency and incident escalation channels.'],
        ['Data retention', 'Retention policy and export permissions.']
      ].map(([title, text]) => (
        <article className="panel settings-card" key={title}>
          <h2>{title}</h2>
          <p>{text}</p>
          <ActionButton icon={Settings2}>Configure</ActionButton>
        </article>
      ))}
    </section>
  );
}

function ApiView() {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Developer and admin API console</h2>
          <p>Live endpoints used by the manager monitoring console.</p>
        </div>
      </div>
      <div className="api-grid">
        {[
          ['GET', '/api/v1/dashboard/home', 'Dashboard status, counts, employee rows.'],
          ['GET', '/api/v1/reports/daily-summary', 'Daily employee summary rows for consolidated analytics.'],
          ['GET', '/api/v1/reports/daily-window-usage', 'Daily window detail rows for employee drill-down.'],
          ['GET', '/api/v1/reports/application-usage', 'Application usage rows for top app charts.'],
          ['GET', '/api/v1/reports/anomalies', 'Review queue for the selected date range.'],
          ['POST', '/api/v1/employees', 'Create an employee using database-backed fields.']
        ].map(([method, path, text]) => (
          <article className="api-card" key={path}>
            <div><span className={`method ${method.toLowerCase()}`}>{method}</span><strong>{path}</strong></div>
            <p>{text}</p>
            <pre>{method === 'POST' ? '{ employeeCode, firstName, lastName, email }' : '?startDate=2026-06-27&endDate=2026-07-03&page=0&size=100&sortDirection=DESC'}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}

