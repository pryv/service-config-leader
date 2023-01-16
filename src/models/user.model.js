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
