/**
 * @license
 * Copyright (C) 2019–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
module.exports = {
  SETTINGS_PERMISSIONS: Object.freeze({
    READ: 'read',
    UPDATE: 'update'
  }),
  USERS_PERMISSIONS: Object.freeze({
    READ: 'read',
    RESET_PASSWORD: 'resetPassword',
    CHANGE_PERMISSIONS: 'changePermissions',
    CREATE: 'create',
    DELETE: 'delete'
  }),
  PLATFORM_USERS_PERMISSIONS: Object.freeze({
    READ: 'read',
    DELETE: 'delete',
    MODIFY: 'modify'
  })
};

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
