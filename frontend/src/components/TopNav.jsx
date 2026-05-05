/**
 * TopNav component - main navigation bar with brand, notifications, and user menu
 */
import { Bell, ChevronDown, Zap } from 'lucide-react';

export default function TopNav({
  unreadCount,
  currentUser,
  users,
  showUserMenu,
  setShowUserMenu,
  onSwitchUser,
  onOpenNotifications,
}) {
  return (
    <nav className="top-nav">
      <div className="brand">
        <div className="brand-icon">
          <Zap size={23} />
        </div>
        <span>NotifyDesk</span>
      </div>

      <div className="nav-actions">
        <button
          className="nav-bell"
          type="button"
          onClick={onOpenNotifications}
          aria-label={`${unreadCount} unread notifications`}
        >
          <Bell size={20} />
          {unreadCount > 0 && <span>{unreadCount}</span>}
        </button>

        {currentUser && (
          <div className="profile-menu-wrap">
            <button
              className="profile-button"
              type="button"
              onClick={() => setShowUserMenu((value) => !value)}
            >
              <div className="avatar">{currentUser.username.slice(0, 1)}</div>
              <div>
                <strong>{currentUser.username}</strong>
                <span>{currentUser.role}</span>
              </div>
              <ChevronDown size={17} />
            </button>

            {showUserMenu && (
              <div className="profile-dropdown">
                <p>Switch user</p>
                {users.map((user) => (
                  <button
                    className={user.id === currentUser.id ? 'active' : ''}
                    key={user.id}
                    type="button"
                    onClick={() => onSwitchUser(user.id)}
                  >
                    <span className="mini-avatar">{user.username.slice(0, 1)}</span>
                    <span>
                      <strong>{user.username}</strong>
                      <small>{user.role}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
