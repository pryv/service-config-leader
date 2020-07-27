// @flow

import type { Permissions } from './permissions.model';

export type User = {
  username: string;
  password: string;
  permissions: Permissions;
}

export type UserNoPass = {
  username: string;
  permissions: Permissions;
}

export type UserNoPerms = {
  username: string;
  password: string;
}

export type UserOptional = {
  username?: ?string;
  password?: ?string;
  permissions?: ?Permissions;
}

export type UserDB = {
  username: string;
  password: string;
  permissions: Permissions | string;
} 
