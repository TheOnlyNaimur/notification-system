import { useEffect, useMemo, useState } from 'react';
import { API_BASE, WS_BASE } from './config';
import { emptyForm, roleTone } from './utils/constants';

// Components
import LoadingScreen from './components/LoadingScreen';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import UserCard from './components/UserCard';
import StatsRow from './components/StatsRow';
import AdminAnnouncementCard from './components/AdminAnnouncementCard';
import NotificationsPanel from './components/NotificationPanel';
import NotificationModal from './components/NotificationModal';

/**
 * Main App Component
 * Container for all app state, effects, and business logic
 */
function App() {
  // ============================
  // STATE
  // ============================
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // ============================
  // DERIVED STATE
  // ============================
  const currentUser = users.find((user) => user.id === Number(currentUserId));
  const isAdmin = currentUser?.role === 'Admin';
  const unreadNotifications = notifications.filter((notification) => !notification.is_read);
  const unreadCount = unreadNotifications.length;
  const readCount = notifications.length - unreadCount;

  // Keep search and status filtering as derived state so the notification list
  // always reflects the latest server/WebSocket data without storing duplicates.
  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unread' && !notification.is_read) ||
        (statusFilter === 'read' && notification.is_read);
      return matchesSearch && matchesStatus;
    });
  }, [notifications, search, statusFilter]);

  // Users and roles are fetched together because the dashboard needs both before
  // choosing the first active user and rendering role-targeted admin controls.
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [usersResponse, rolesResponse] = await Promise.all([
          fetch(`${API_BASE}/users`),
          fetch(`${API_BASE}/roles`),
        ]);

        if (!usersResponse.ok || !rolesResponse.ok) {
          throw new Error('Could not load users and roles.');
        }

        const usersData = await usersResponse.json();
        const rolesData = await rolesResponse.json();

        setUsers(usersData);
        setRoles(rolesData);
        setCurrentUserId(String(usersData[0]?.id ?? ''));
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Reload the inbox whenever the simulated active user changes. This keeps the
  // user-switcher behavior close to logging in as a different account.
  useEffect(() => {
    if (!currentUserId) return;

    async function loadNotifications() {
      try {
        const response = await fetch(`${API_BASE}/notifications?user_id=${currentUserId}`);
        if (!response.ok) throw new Error('Could not load notifications.');
        setNotifications(await response.json());
      } catch (loadError) {
        setError(loadError.message);
      }
    }

    loadNotifications();
  }, [currentUserId]);

  // Subscribe per user so real-time notifications land only in the active inbox.
  // The cleanup closes the old socket before a different user's socket is opened.
  useEffect(() => {
    if (!currentUserId) return undefined;

    const socket = new WebSocket(`${WS_BASE}/ws/${currentUserId}`);

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      const notification = payload.notifications?.[currentUserId];

      if (payload.type === 'notification' && notification) {
        setNotifications((existing) => [notification, ...existing]);
        setSuccess('New notification received.');
      }
    };

    return () => socket.close();
  }, [currentUserId]);

  // ============================
  // HANDLERS
  // ============================
  const switchUser = (userId) => {
    setCurrentUserId(String(userId));
    setSearch('');
    setStatusFilter('all');
    setSuccess('');
    setError('');
    setShowUserMenu(false);
    setShowNotificationModal(false);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleRole = (roleId) => {
    setForm((current) => {
      const exists = current.role_ids.includes(roleId);
      // Store selected role ids in the form payload shape expected by the API.
      return {
        ...current,
        role_ids: exists
          ? current.role_ids.filter((id) => id !== roleId)
          : [...current.role_ids, roleId],
      };
    });
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.audience_type === 'roles' && form.role_ids.length === 0) {
      setError('Choose at least one role or switch the audience to all users.');
      return;
    }

    setSubmitting(true);
    try {
      // Trim text at submit time so users can keep editing naturally while the
      // backend still receives clean notification content.
      const response = await fetch(`${API_BASE}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          message: form.message.trim(),
        }),
      });

      if (!response.ok) {
        const details = await response.json();
        throw new Error(details.detail || 'Could not send notification.');
      }

      const result = await response.json();
      setForm(emptyForm);
      setSuccess(`Announcement sent to ${result.recipient_count} user${result.recipient_count === 1 ? '' : 's'}.`);
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReadState = async (notification) => {
    try {
      const response = await fetch(`${API_BASE}/notifications/${notification.state_id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: !notification.is_read }),
      });

      if (!response.ok) throw new Error('Could not update notification.');
      const updated = await response.json();

      // Replace only the changed notification to preserve list order and avoid
      // refetching the whole inbox after a simple read/unread toggle.
      setNotifications((existing) =>
        existing.map((item) => (item.state_id === updated.state_id ? updated : item)),
      );
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const markAsReadFromModal = async (notification) => {
    // Opening an unread item from the notification center counts as reading it.
    if (!notification.is_read) {
      await toggleReadState(notification);
    }
  };

  // ============================
  // RENDER
  // ============================
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="app-shell">
      {/* Top Navigation */}
      <TopNav
        unreadCount={unreadCount}
        currentUser={currentUser}
        users={users}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        onSwitchUser={switchUser}
        onOpenNotifications={() => setShowNotificationModal(true)}
      />

      <div className="dashboard-layout">
        {/* Sidebar */}
        <Sidebar activeItem="dashboard" onSelectItem={() => {}} />

        <section className="dashboard-main">
          {/* Page Heading */}
          <div className="page-heading">
            <div>
              <p>Dashboard</p>
              <h1>Role based notification overview</h1>
            </div>
            <span className={`role-pill ${roleTone[currentUser?.role]}`}>{currentUser?.role}</span>
          </div>

          {/* User Card */}
          <UserCard
            currentUser={currentUser}
            unreadCount={unreadCount}
            totalReceived={notifications.length}
          />

          {/* Stats Row */}
          <StatsRow
            totalReceived={notifications.length}
            unreadCount={unreadCount}
            readCount={readCount}
          />

          {/* Admin Panel */}
          {isAdmin && (
            <AdminAnnouncementCard
              roles={roles}
              form={form}
              submitting={submitting}
              error={error}
              success={success}
              onUpdateForm={updateForm}
              onToggleRole={toggleRole}
              onSubmit={sendNotification}
            />
          )}

          {/* Show errors for non-admin users */}
          {!isAdmin && error && <div className="toast toast-error">{error}</div>}
          {!isAdmin && success && <div className="toast toast-success">{success}</div>}

          {/* Notifications Panel */}
          <NotificationsPanel
            notifications={filteredNotifications}
            roles={roles}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onToggleRead={toggleReadState}
          />
        </section>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <NotificationModal
          notifications={unreadNotifications}
          roles={roles}
          onClose={() => setShowNotificationModal(false)}
          onRead={markAsReadFromModal}
        />
      )}
    </main>
  );
}

export default App;
