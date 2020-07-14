// @flow

type SettingsPermissions = "read" | "update";
type UsersPermissions = "read" | "resetPassword" | "changePermissions" | "create" | "delete";
type Permission = SettingsPermissions | UsersPermissions;

export interface Permissions {
  [key: string]: Permission
}

export const SETTINGS_PERMISSIONS = Object.freeze({
  READ: 'read',
  UPDATE: 'update',
});

export const USERS_PERMISSIONS = Object.freeze({
  READ: 'read',
  RESET_PASSWORD: 'resetPassword',
  CHANGE_PERMISSIONS: 'changePermissions',
  CREATE: 'create',
  DELETE: 'delete'
});