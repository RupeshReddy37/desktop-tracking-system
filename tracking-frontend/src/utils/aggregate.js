import { combineName, formatCompactDuration, formatDateTime, safeText } from '../lib/format';
import { isoDate, todayDate } from './date';
import { exportRows } from './csv';

export function normalizeStatus(status) {
  return String(status || 'UNKNOWN').toUpperCase();
}

export function statusClass(status) {
  return `status status-${normalizeStatus(status).toLowerCase().replace('_', '-')}`;
}

export function isSeenToday(value) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? isoDate(date) === todayDate() : false;
}

export function displayLastSeen(value) {
  if (!value) return 'Not seen yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not seen yet';
  return formatDateTime(value);
}

export function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / total) * 100);
}

export function employeeName(row) {
  return combineName(row.firstName, row.lastName);
}

export function initialsFor(row) {
  return employeeName(row)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'EM';
}

export function groupTrendRows(rows, mode) {
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

export function consolidateUsage(rows, employeeBase = []) {
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

export function employeeLookupKey(row) {
  return [
    String(row.employeeId ?? row.id ?? '').trim().toLowerCase(),
    String(row.employeeCode ?? '').trim().toLowerCase(),
    String(row.email ?? '').trim().toLowerCase()
  ].filter(Boolean).join('|');
}

export function consolidateEmployeeSummary(rows, employeeBase = []) {
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

export function matchesEmployee(row, employee) {
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

export function aggregateStatusTotals(rows) {
  return rows.reduce((acc, row) => {
    acc.active += Number(row.active || row.activeSeconds || row.activeSecondsToday || 0);
    acc.idle += Number(row.idle || row.idleSeconds || row.idleSecondsToday || 0);
    acc.locked += Number(row.locked || row.lockedSeconds || row.lockedSecondsToday || 0);
    acc.offline += Number(row.offline || row.offlineSeconds || row.offlineSecondsToday || 0);
    return acc;
  }, { active: 0, idle: 0, locked: 0, offline: 0 });
}

export function displayWindowTitle(row) {
  return safeText(row.documentTitle || row.windowTitle || row.applicationName || row.processName || 'Window');
}

export function splitLabel(value) {
  if (!value) return '-';
  const parts = String(value).split(/[\\\/]/).filter(Boolean);
  return parts[parts.length - 1] || value;
}

export function exportEmployeeSummaryRows(rows, { startDate = null, endDate = null, filenamePrefix = 'employee-summary' } = {}) {
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

export function exportEmployeeUsageRows(rows, { employeeLabel = 'employee', startDate = null, endDate = null, filenamePrefix = 'employee-candidate-report' } = {}) {
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

export function groupReportRows(rows, tab, groupBy) {
  const map = new Map();

  rows.forEach((row) => {
    const rawDate = row.usageDate || row.date || row.createdAt || row.lastSeenAt;
    const key = rawDate ? isoDate(new Date(rawDate)) : 'Unknown';
    if (!map.has(key)) {
      map.set(key, { key, label: key, active: 0, idle: 0, locked: 0, offline: 0 });
    }
    const bucket = map.get(key);
    bucket.active += Number(row.activeSeconds || row.active || 0);
    bucket.idle += Number(row.idleSeconds || row.idle || 0);
    bucket.locked += Number(row.lockedSeconds || row.locked || 0);
    bucket.offline += Number(row.offlineSeconds || row.offline || 0);
  });

  return [...map.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((row) => ({
      ...row,
      label: row.key === 'Unknown'
        ? row.key
        : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(new Date(row.key))
    }));
}


