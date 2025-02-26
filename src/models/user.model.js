/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
/**
 * @typedef {{
 *   username: string
 *   password: string
 *   permissions: Permissions
 * }} User
 */

/**
 * @typedef {{
 *   username: string
 *   permissions: Permissions
 * }} UserNoPass
 */

/**
 * @typedef {{
 *   username: string
 *   password: string
 * }} UserNoPerms
 */

/**
 * @typedef {{
 *   username?: string | null
 *   password?: string | null
 *   permissions?: Permissions | null
 * }} UserOptional
 */

/**
 * @typedef {{
 *   username: string
 *   password: string
 *   permissions: Permissions | string
 * }} UserDB
 */

/**
 * @typedef {{
 *   oldPassword: string
 *   newPassword: string
 *   newPasswordCheck: string
 * }} UserPasswordChange
 */
