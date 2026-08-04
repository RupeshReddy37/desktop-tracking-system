import {
  Home,
  Users,
  UserPlus,
  ClipboardList,
  ShieldAlert,
  Monitor,
  Settings2,
  Code2,
  CalendarDays,
  AppWindow,
  Layers
} from 'lucide-react';


export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: Home },
  { id: 'employees', label: 'Employees', path: '/employees', icon: Users },
  { id: 'addEmployee', label: 'Add Employee', path: '/employees/new', icon: UserPlus },
  { id: 'reports', label: 'Activity Reports', path: '/reports', icon: ClipboardList },
  { id: 'anomalies', label: 'Anomaly Review', path: '/anomalies', icon: ShieldAlert },
  { id: 'devices', label: 'Devices / Agents', path: '/devices', icon: Monitor },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings2 },
  { id: 'api', label: 'API Console', path: '/api-console', icon: Code2 }
];

export const TREND_MODES = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
  { id: 'year', label: 'This year' }
];

export const REPORT_CHART_MODES = [
  { id: 'bar', label: 'Bar graph' },
  { id: 'line', label: 'Line graph' },
  { id: 'xy', label: 'XY graph' },
  { id: 'histogram', label: 'Histogram' },
  { id: 'pie', label: 'Pie chart' }
];

export const STATUS_OPTIONS = [
  { id: 'all', label: 'All statuses' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'IDLE', label: 'Idle' },
  { id: 'LOCKED', label: 'Locked' },
  { id: 'OFFLINE', label: 'Offline' }
];

export const EMPLOYEE_DB_OPTIONS = [
  { id: 'all', label: 'All employees' },
  { id: 'active', label: 'Active employees' },
  { id: 'inactive', label: 'Inactive employees' }
];

export const REPORT_TABS = [
  { id: 'daily', label: 'Daily Summary', icon: CalendarDays },
  { id: 'apps', label: 'Application Usage', icon: AppWindow },
  { id: 'windows', label: 'Window Usage', icon: Layers }
];

export const REPORT_MODES = [
  { id: 'bar', label: 'Bar' },
  { id: 'pie', label: 'Pie' },
  { id: 'table', label: 'Table' }
];

export const REPORT_GROUP_OPTIONS = [
  { id: 'day', label: 'By day' },
  { id: 'week', label: 'By week' },
  { id: 'month', label: 'By month' }
];

export const ANOMALY_TYPE_OPTIONS = [
  { id: 'all', label: 'All types' },
  { id: 'LOW_ACTIVITY', label: 'Low activity' },
  { id: 'UNUSUAL_HOURS', label: 'Unusual hours' },
  { id: 'EXCESSIVE_IDLE', label: 'Excessive idle' }
];

export const ANOMALY_STATUS_OPTIONS = [
  { id: 'all', label: 'All statuses' },
  { id: 'OPEN', label: 'Open' },
  { id: 'RESOLVED', label: 'Resolved' }
];


