import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Toast } from './components/ui/Primitives';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { EmployeesPage } from './pages/Employees';
import { AddEmployeePage } from './pages/AddEmployee';
import { ReportsPage } from './pages/Reports';
import { AnomaliesPage } from './pages/Anomalies';
import { DevicesPage } from './pages/Devices';
import { CategoriesPage } from './pages/Categories';
import { SettingsPage } from './pages/Settings';
import { ApiPage } from './pages/Api';
import { UnauthorizedPage, ForbiddenPage } from './pages/Unauthorized';
import { todayDate } from './utils/date';

function AppRoutes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => todayDate());
  const [toast, setToast] = useState('');

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                error=""
                activeCount={0}
              />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage selectedDate={selectedDate} onToast={showToast} />} />
          <Route path="/employees" element={<EmployeesPage searchTerm={searchTerm} onToast={showToast} />} />
          <Route path="/employees/new" element={<AddEmployeePage onToast={showToast} />} />
          <Route path="/reports" element={<ReportsPage selectedDate={selectedDate} onToast={showToast} />} />
          <Route path="/anomalies" element={<AnomaliesPage onToast={showToast} />} />
          <Route path="/devices" element={<DevicesPage onToast={showToast} />} />
          <Route path="/categories" element={<CategoriesPage onToast={showToast} />} />
          <Route path="/settings" element={<SettingsPage onToast={showToast} />} />
          <Route path="/api-console" element={<ApiPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <Toast message={toast} onDismiss={() => setToast('')} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
