/**
 * Convert backend audience data into the labels shown on notification cards.
 * Unknown role ids are ignored so deleted/stale roles do not render as blanks.
 */
export function formatAudience(notification, roles) {
  if (notification.audience_type === 'all') {
    return 'All users';
  }

  return notification.role_ids
    .map((roleId) => roles.find((role) => role.id === roleId)?.name)
    .filter(Boolean)
    .join(', ');
}

/**
 * Use the browser locale formatter to keep notification timestamps readable
 * without hand-building date strings.
 */
export function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue));
}
