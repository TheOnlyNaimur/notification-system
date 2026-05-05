/**
 * NotificationModal component - modal showing unread notifications
 */
import { Bell, X } from 'lucide-react';
import { formatAudience, formatDate } from '../utils/format';

export default function NotificationModal({ notifications, roles, onClose, onRead }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="notification-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="section-kicker">Notification center</span>
            <h2>Unread messages</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close notifications">
            <X size={19} />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="modal-empty">
            <Bell size={34} />
            <h3>No unread notifications</h3>
            <p>You are all caught up.</p>
          </div>
        ) : (
          <div className="modal-list">
            {notifications.map((notification) => (
              <button
                key={notification.state_id}
                type="button"
                className="modal-notification"
                onClick={() => onRead(notification)}
              >
                <span className="unread-dot" />
                <span>
                  <strong>{notification.title}</strong>
                  <small>{notification.message}</small>
                  <em>
                    {formatAudience(notification, roles)} • {formatDate(notification.created_at)}
                  </em>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}