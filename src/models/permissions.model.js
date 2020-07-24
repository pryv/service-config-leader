// @flow

type SettingsPermission = "read" | "update";
type UsersPermission =
  | "read"
  | "resetPassword"
  | "changePermissions"
  | "create"
  | "delete";
type PermissionsGroup = "users" | "settings";
export type Permission = SettingsPermission | UsersPermission;

export interface Permissions {
  users: Permission[];
  settings: Permission[];
  [key: PermissionsGroup]: Permission[];
}

export const SETTINGS_PERMISSIONS = Object.freeze({
  READ: "read",
  UPDATE: "update",
});

export const USERS_PERMISSIONS = Object.freeze({
  READ: "read",
  RESET_PASSWORD: "resetPassword",
  CHANGE_PERMISSIONS: "changePermissions",
  CREATE: "create",
  DELETE: "delete",
});
