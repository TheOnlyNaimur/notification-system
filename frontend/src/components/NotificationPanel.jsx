/**
 * NotificationsPanel component - panel with search, filter, and notification list
 */
import { Bell, Search } from 'lucide-react';
import NotificationList from './NotificationList';

export default function NotificationsPanel({
  notifications,
  roles,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onToggleRead,
}) {
  return (
    <section className="panel inbox-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Recent activity</span>
          <h2>Notifications</h2>
        </div>
        <Bell size={22} />
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title or message"
          />
        </div>
        <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      <NotificationList notifications={notifications} roles={roles} onToggleRead={onToggleRead} />
    </section>
  );
}

