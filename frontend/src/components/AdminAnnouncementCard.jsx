import { Check, Loader2, Megaphone, Send } from 'lucide-react';

/**
 * AdminAnnouncementCard component - form for admins to create and send notifications
 * Only visible to Admin users
 */
export default function AdminAnnouncementCard({
  roles,
  form,
  submitting,
  error,
  success,
  onUpdateForm,
  onToggleRole,
  onSubmit,
}) {
  return (
    <section className="panel admin-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Admin only</span>
          <h2>Send announcement</h2>
        </div>
        <Megaphone size={22} />
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            Title
            <input
              value={form.title}
              onChange={(event) => onUpdateForm('title', event.target.value)}
              placeholder="Example: Maintenance update"
              required
            />
          </label>

          <label>
            Audience
            <div className="audience-toggle" aria-label="Audience type">
              <button
                type="button"
                className={form.audience_type === 'all' ? 'active' : ''}
                onClick={() => onUpdateForm('audience_type', 'all')}
              >
                All users
              </button>
              <button
                type="button"
                className={form.audience_type === 'roles' ? 'active' : ''}
                onClick={() => onUpdateForm('audience_type', 'roles')}
              >
                By role
              </button>
            </div>
          </label>
        </div>

        {form.audience_type === 'roles' && (
          <div className="role-selector">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                className={form.role_ids.includes(role.id) ? 'selected' : ''}
                onClick={() => onToggleRole(role.id)}
              >
                <Check size={14} />
                {role.name}
              </button>
            ))}
          </div>
        )}

        <label>
          Message
          <textarea
            value={form.message}
            onChange={(event) => onUpdateForm('message', event.target.value)}
            placeholder="Write the notification message here..."
            rows="4"
            required
          />
        </label>

        <button className="send-button" type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
          {submitting ? 'Sending...' : 'Send notification'}
        </button>
      </form>

      {(error || success) && (
        <div className={error ? 'toast toast-error' : 'toast toast-success'}>
          {error || success}
        </div>
      )}
    </section>
  );
}
