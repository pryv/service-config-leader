// @flow

type PlatformUsersPermission = 'read' | 'delete';
type SettingsPermission = 'read' | 'update';
type UsersPermission =
  | 'read'
  | 'resetPassword'
  | 'changePermissions'
  | 'create'
  | 'delete';
export type PermissionsGroup = 'users' | 'settings' | 'platformUsers';
export type Permission =
  | SettingsPermission
  | UsersPermission
  | PlatformUsersPermission;

export type Permissions = {
  users: UsersPermission[],
  settings: SettingsPermission[],
  platformUsers: PlatformUsersPermission[],
  [key: PermissionsGroup]: Permission[],
};

export const SETTINGS_PERMISSIONS = Object.freeze({
  READ: 'read',
  UPDATE: 'update',
});

export const USERS_PERMISSIONS = Object.freeze({
  READ: 'read',
  RESET_PASSWORD: 'resetPassword',
  CHANGE_PERMISSIONS: 'changePermissions',
  CREATE: 'create',
  DELETE: 'delete',
});

export const PLATFORM_USERS_PERMISSIONS = Object.freeze({
  READ: 'read',
  DELETE: 'delete',
});
