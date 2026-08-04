import { api } from './api';

function toQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function getHomeDashboard(params) {
  return api.get(`/api/v1/dashboard/home${toQuery(params)}`);
}

export function getEmployeeProfile(employeeId) {
  return api.get(`/api/v1/dashboard/profile/${employeeId}`);
}

export function getEmployees() {
  return api.get('/api/v1/employees');
}

export function createEmployee(payload) {
  return api.post('/api/v1/employees', payload);
}

export function getDailySummary(params) {
  return api.get(`/api/v1/reports/daily-summary${toQuery(params)}`);
}

export function getApplicationUsage(params) {
  return api.get(`/api/v1/reports/application-usage${toQuery(params)}`);
}

export function getDailyWindowUsage(params) {
  return api.get(`/api/v1/reports/daily-window-usage${toQuery(params)}`);
}

export function getAnomalies(params) {
  return api.get(`/api/v1/anomalies${toQuery(params)}`);
}

export function getEmployeeAnomalies(employeeId, params) {
  return api.get(`/api/v1/anomalies/employee/${employeeId}${toQuery(params)}`);
}

export function getDevices() {
  return api.get('/api/v1/devices');
}

export function getServerHealth() {
  return api.get('/actuator/health', { auth: false });
}
