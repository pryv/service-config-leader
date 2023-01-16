import type { Permissions } from './permissions.model';

export type User = {
  username: string
  password: string
  permissions: Permissions
};

export type UserNoPass = {
  username: string
  permissions: Permissions
};

export type UserNoPerms = {
  username: string
  password: string
};

export type UserOptional = {
  username?: string | null
  password?: string | null
  permissions?: Permissions | null
};

export type UserDB = {
  username: string
  password: string
  permissions: Permissions | string
};

export type UserPasswordChange = {
  oldPassword: string
  newPassword: string
  newPasswordCheck: string
};
