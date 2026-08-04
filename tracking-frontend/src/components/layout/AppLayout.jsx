import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NAV_ITEMS } from '../../constants/navigation';
import { useAuth } from '../../context/AuthContext';

export function AppLayout({ searchTerm, onSearch, selectedDate, onDateChange, error, activeCount }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const current = NAV_ITEMS.find((item) => item.path === location.pathname);
  const title = current?.label || 'Dashboard';

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar
        error={error}
        activeCount={activeCount}
        onNavigate={() => setSidebarOpen(false)}
      />
      <main className="workspace">
        <Topbar
          title={title}
          searchTerm={searchTerm}
          onSearch={onSearch}
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          onLogout={logout}
        />
        <section className="content-main full-width">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
