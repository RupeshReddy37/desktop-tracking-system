import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Toast } from './components/ui/Primitives';
import { LoginPage } from './pages/Login';
import { todayDate } from './utils/date';

// OPTIMIZATION: Lazy load pages for code splitting
const DashboardPage = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.DashboardPage })));
const EmployeesPage = lazy(() => import('./pages/Employees').then(m => ({ default: m.EmployeesPage })));
const AddEmployeePage = lazy(() => import('./pages/AddEmployee').then(m => ({ default: m.AddEmployeePage })));
const ReportsPage = lazy(() => import('./pages/Reports').then(m => ({ default: m.ReportsPage })));
const AnomaliesPage = lazy(() => import('./pages/Anomalies').then(m => ({ default: m.AnomaliesPage })));
const DevicesPage = lazy(() => import('./pages/Devices').then(m => ({ default: m.DevicesPage })));
const CategoriesPage = lazy(() => import('./pages/Categories').then(m => ({ default: m.CategoriesPage })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.SettingsPage })));
const ApiPage = lazy(() => import('./pages/Api').then(m => ({ default: m.ApiPage })));
const UnauthorizedPage = lazy(() => import('./pages/Unauthorized').then(m => ({ default: m.UnauthorizedPage })));
const ForbiddenPage = lazy(() => import('./pages/Unauthorized').then(m => ({ default: m.ForbiddenPage })));

// Loading fallback component
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div>Loading...</div>
    </div>
  );
}

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
        <Route path="/unauthorized" element={
          <Suspense fallback={<PageLoader />}>
            <UnauthorizedPage />
          </Suspense>
        } />
        <Route path="/forbidden" element={
          <Suspense fallback={<PageLoader />}>
            <ForbiddenPage />
          </Suspense>
        } />

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
          <Route path="/dashboard" element={
            <Suspense fallback={<PageLoader />}>
              <DashboardPage selectedDate={selectedDate} onToast={showToast} />
            </Suspense>
          } />
          <Route path="/employees" element={
            <Suspense fallback={<PageLoader />}>
              <EmployeesPage searchTerm={searchTerm} onToast={showToast} />
            </Suspense>
          } />
          <Route path="/employees/new" element={
            <Suspense fallback={<PageLoader />}>
              <AddEmployeePage onToast={showToast} />
            </Suspense>
          } />
          <Route path="/reports" element={
            <Suspense fallback={<PageLoader />}>
              <ReportsPage selectedDate={selectedDate} onToast={showToast} />
            </Suspense>
          } />
          <Route path="/anomalies" element={
            <Suspense fallback={<PageLoader />}>
              <AnomaliesPage onToast={showToast} />
            </Suspense>
          } />
          <Route path="/devices" element={
            <Suspense fallback={<PageLoader />}>
              <DevicesPage onToast={showToast} />
            </Suspense>
          } />
          <Route path="/categories" element={
            <Suspense fallback={<PageLoader />}>
              <CategoriesPage onToast={showToast} />
            </Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<PageLoader />}>
              <SettingsPage onToast={showToast} />
            </Suspense>
          } />
          <Route path="/api-console" element={
            <Suspense fallback={<PageLoader />}>
              <ApiPage />
            </Suspense>
          } />
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
