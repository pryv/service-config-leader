// @flow

import { Permissions } from "./permissions.model";

export interface User {
  username: string;
  password: string;
  permissions: Permissions;
}

export interface UserNoPass {
  username: string;
  permissions: Permissions;
}

export interface UserNoPerms {
  username: string;
  password: string;
}

export interface UserOptional {
  username?: string;
  password?: string;
  permissions?: Permissions;
}
