import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, LogOut, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DatePickerControl } from '../ui/Primitives';

export function Topbar({ title, searchTerm, onSearch, selectedDate, onDateChange, onLogout }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  async function handleLogout() {
    await onLogout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title">
          <span className="title-mark"><Users size={16} /></span>
          <div><h1>{title}</h1></div>
        </div>
      </div>

      <div className="command-bar">
        <label className="search-box">
          <Search size={16} />
          <input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Search employees..." />
        </label>
        <DatePickerControl value={selectedDate} onChange={onDateChange} />
        <button type="button" className="notification-button" title="Notifications" aria-label="Notifications">
          <Bell size={21} />
        </button>
        <div className="user-chip">
          <span>{initials}</span>
          <div>
            <strong>{user?.username || 'User'}</strong>
            <small>{user?.role || 'User'}</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <button type="button" className="logout-button" title="Sign out" aria-label="Sign out" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
