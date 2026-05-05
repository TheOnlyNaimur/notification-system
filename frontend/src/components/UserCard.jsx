/*
 =======================================================================
 * UserCard component - displays current user info and stats
 =======================================================================
*/

import Detail from './ui/Detail';
export default function UserCard({ currentUser, unreadCount, totalReceived }) {
  if (!currentUser) return null;

  return (
    <section className="user-card">
      <div className="user-card-main">
        <div className="profile-photo">{currentUser.username.slice(0, 1)}</div>
        <div>
          <span className="section-kicker">Current user</span>
          <h2>{currentUser.username}</h2>
          <p>{currentUser.email}</p>
        </div>
      </div>
      <div className="user-details-grid">
        <Detail label="Role" value={currentUser.role} />
        <Detail label="User ID" value={`#${currentUser.id}`} />
        <Detail label="Unread" value={unreadCount} />
        <Detail label="Total received" value={totalReceived} />
      </div>
    </section>
  );
}
