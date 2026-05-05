/**
 * Map backend role names to CSS tone classes used across the dashboard.
 */
export const roleTone = {
  Admin: 'role-admin',
  Manager: 'role-manager',
  Editor: 'role-editor',
  Viewer: 'role-viewer',
  Support: 'role-support',
};

/**
 * Centralized initial form state makes submit reset and future form defaults
 * use the same payload shape.
 */
export const emptyForm = {
  title: '',
  message: '',
  audience_type: 'all',
  role_ids: [],
};
