/**
 * Sidebar component - left navigation with menu items
 */
import { Bell, LayoutDashboard, MessageSquare, Shield, Users } from 'lucide-react';

export default function Sidebar({ activeItem = 'dashboard', onSelectItem }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles', label: 'Roles', icon: Shield },
  ];

  return (
    <aside className="sidebar">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={activeItem === item.id ? 'active' : ''}
            type="button"
            onClick={() => onSelectItem?.(item.id)}
          >
            <Icon size={19} />
            {item.label}
          </button>
        );
      })}
    </aside>
  );
}
