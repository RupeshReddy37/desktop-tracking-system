const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

function buildUrl(path) {
  if (!RAW_BASE_URL) {
    return path;
  }

  return new URL(path, RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL : `${RAW_BASE_URL}/`).toString();
}

async function requestJson(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload
      ? payload.message || payload.error || `Request failed with ${response.status}`
      : `Request failed with ${response.status}`;

    throw new Error(message);
  }

  return payload;
}

function queryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function getHomeDashboard(params) {
  return requestJson(`/api/v1/dashboard/home${queryString(params)}`);
}

export function getEmployeeProfile(employeeId) {
  return requestJson(`/api/v1/dashboard/employees/${employeeId}/profile`);
}

export function getEmployees() {
  return requestJson('/api/v1/employees');
}

export function getDailySummary(params) {
  return requestJson(`/api/v1/reports/daily-summary${queryString(params)}`);
}

export function getDailyWindowUsage(params) {
  return requestJson(`/api/v1/reports/daily-window-usage${queryString(params)}`);
}

export function getApplicationUsage(params) {
  return requestJson(`/api/v1/reports/application-usage${queryString(params)}`);
}

export function getAnomalies(params) {
  return requestJson(`/api/v1/reports/anomalies${queryString(params)}`);
}

export function getEmployeeAnomalies(employeeId, params) {
  return requestJson(`/api/v1/reports/employees/${employeeId}/anomalies${queryString(params)}`);
}

export function createEmployee(body) {
  return requestJson('/api/v1/employees', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function registerDevice(body) {
  return requestJson('/api/v1/devices/register', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function sendAgentSync(body) {
  return requestJson('/api/v1/sync', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function buildSampleUrl(path, params) {
  return `${path}${queryString(params)}`;
}

export function getApiBaseLabel() {
  return RAW_BASE_URL || 'Vite proxy -> http://localhost:8081';
}
