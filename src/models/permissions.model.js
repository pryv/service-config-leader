export const SETTINGS_PERMISSIONS = Object.freeze({
  READ: 'read',
  UPDATE: 'update'
});

export const USERS_PERMISSIONS = Object.freeze({
  READ: 'read',
  RESET_PASSWORD: 'resetPassword',
  CHANGE_PERMISSIONS: 'changePermissions',
  CREATE: 'create',
  DELETE: 'delete'
});

export const PLATFORM_USERS_PERMISSIONS = Object.freeze({
  READ: 'read',
  DELETE: 'delete',
  MODIFY: 'modify'
});

/**
 * @typedef {"read" | "delete"} PlatformUsersPermission
 */

/**
 * @typedef {"read" | "update"} SettingsPermission
 */

/**
 * @typedef {"read" | "resetPassword" | "changePermissions" | "create" | "delete"} UsersPermission
 */

/**
 * @typedef {"users" | "settings" | "platformUsers"} PermissionsGroup
 */

/**
 * @typedef {SettingsPermission | UsersPermission | PlatformUsersPermission} Permission
 */

/**
 * @typedef {{
 *   users: UsersPermission[]
 *   settings: SettingsPermission[]
 *   platformUsers: PlatformUsersPermission[]
 *   [key: PermissionsGroup]: Permission[]
 * }} Permissions
 */
