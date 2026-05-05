/**
 * NotificationList component - displays list of notifications
 */
import { Bell, Clock3, Users } from 'lucide-react';
import { formatAudience, formatDate } from '../utils/format';

export default function NotificationList({ notifications, roles, onToggleRead }) {
  if (notifications.length === 0) {
    return (
      <div className="empty-state">
        <Bell size={38} />
        <h3>No notifications here</h3>
        <p>Try another filter, or send one from the Admin account.</p>
      </div>
    );
  }

  return (
    <div className="notification-list">
      {notifications.map((notification) => (
        <article
          className={`notification-card ${notification.is_read ? 'read' : 'unread'}`}
          key={notification.state_id}
        >
          <div className="notification-status" />
          <div className="notification-body">
            <div className="notification-title-row">
              <h3>{notification.title}</h3>
              <span>{notification.is_read ? 'Read' : 'Unread'}</span>
            </div>
            <p>{notification.message}</p>
            <div className="notification-meta">
              <span>
                <Users size={14} />
                {formatAudience(notification, roles)}
              </span>
              <span>
                <Clock3 size={14} />
                {formatDate(notification.created_at)}
              </span>
            </div>
          </div>
          <button
            className="mark-button"
            type="button"
            onClick={() => onToggleRead(notification)}
          >
            Mark {notification.is_read ? 'unread' : 'read'}
          </button>
        </article>
      ))}
    </div>
  );
}
