/**
 * @license
 * Copyright (C) 2019–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
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
