export const mockHome = {
  counts: {
    totalEmployees: 12,
    activeEmployees: 5,
    idleEmployees: 4,
    lockedEmployees: 1,
    offlineEmployees: 2,
    notRegisteredEmployees: 0,
    unknownEmployees: 0
  },
  page: 0,
  size: 8,
  totalElements: 12,
  totalPages: 2,
  employees: [
    {
      employeeId: 1,
      employeeCode: 'EMP001',
      firstName: 'Rohit',
      lastName: 'Sharma',
      email: 'rohit.sharma@company.com',
      currentStatus: 'ACTIVE',
      statusSinceAt: '2026-07-02T09:10:00Z',
      lastSeenAt: '2026-07-02T09:18:00Z',
      activeSecondsToday: 12360,
      idleSecondsToday: 1800,
      lockedSecondsToday: 0,
      offlineSecondsToday: 0
    },
    {
      employeeId: 2,
      employeeCode: 'EMP002',
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@company.com',
      currentStatus: 'IDLE',
      statusSinceAt: '2026-07-02T08:44:00Z',
      lastSeenAt: '2026-07-02T09:05:00Z',
      activeSecondsToday: 10800,
      idleSecondsToday: 2460,
      lockedSecondsToday: 0,
      offlineSecondsToday: 0
    },
    {
      employeeId: 3,
      employeeCode: 'EMP003',
      firstName: 'Amit',
      lastName: 'Kumar',
      email: 'amit.kumar@company.com',
      currentStatus: 'LOCKED',
      statusSinceAt: '2026-07-02T08:20:00Z',
      lastSeenAt: '2026-07-02T08:20:00Z',
      activeSecondsToday: 7320,
      idleSecondsToday: 960,
      lockedSecondsToday: 1800,
      offlineSecondsToday: 0
    }
  ]
};

export const mockProfile = {
  employeeId: 1,
  employeeCode: 'EMP001',
  firstName: 'Rohit',
  lastName: 'Sharma',
  email: 'rohit.sharma@company.com',
  active: true,
  deviceId: 18,
  agentDeviceId: 'b5f8d4d2-24c0-4db0-8e4f-11fcb1f6f3a8',
  hostname: 'ROHIT-LAPTOP',
  operatingSystem: 'Windows 11 (64-bit)',
  agentVersion: '1.0.0',
  lastSeenAt: '2026-07-02T09:18:00Z',
  createdAt: '2026-06-30T07:20:00Z',
  updatedAt: '2026-07-02T09:18:00Z'
};

export const mockDailyUsage = [
  {
    employeeId: 1,
    employeeCode: 'EMP001',
    firstName: 'Rohit',
    lastName: 'Sharma',
    email: 'rohit.sharma@company.com',
    deviceId: 18,
    usageDate: '2026-07-02',
    applicationName: 'Visual Studio Code',
    processName: 'Code.exe',
    activeSeconds: 15600,
    idleSeconds: 2400
  },
  {
    employeeId: 1,
    employeeCode: 'EMP001',
    firstName: 'Rohit',
    lastName: 'Sharma',
    email: 'rohit.sharma@company.com',
    deviceId: 18,
    usageDate: '2026-07-02',
    applicationName: 'Google Chrome',
    processName: 'chrome.exe',
    activeSeconds: 6600,
    idleSeconds: 600
  },
  {
    employeeId: 2,
    employeeCode: 'EMP002',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@company.com',
    deviceId: 19,
    usageDate: '2026-07-02',
    applicationName: 'IntelliJ IDEA',
    processName: 'idea64.exe',
    activeSeconds: 14400,
    idleSeconds: 1800
  }
];

export const mockAnomalies = [
  {
    employeeId: 1,
    employeeCode: 'EMP001',
    firstName: 'Rohit',
    lastName: 'Sharma',
    email: 'rohit.sharma@company.com',
    detectedAt: '2026-07-02T08:55:00Z',
    anomalyType: 'KEY_HELD_PATTERN',
    confidence: 'High',
    reasonSummary: 'Keyboard repeats at near-fixed intervals with no context change.',
    reviewStatus: 'Needs Review'
  },
  {
    employeeId: 2,
    employeeCode: 'EMP002',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@company.com',
    detectedAt: '2026-07-02T09:08:00Z',
    anomalyType: 'SCRIPTED_CLICK_PATTERN',
    confidence: 'Medium',
    reasonSummary: 'Mouse clicks repeated at a steady interval with minimal movement.',
    reviewStatus: 'Needs Review'
  }
];
