import { NavLink } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { NAV_ITEMS } from '../../constants/navigation';

export function Sidebar({ error, activeCount, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon"><LayoutDashboard size={21} /></div>
        <div>
          <strong>Work Day</strong>
          <span>Monitoring App</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onNavigate}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-health">
        <div>
          <span className="pulse" />
          <strong>Live server</strong>
        </div>
        <p>{error ? 'Connection issue' : 'Connected'}</p>
        <b>{activeCount} active employees</b>
      </div>
    </aside>
  );
}
