/**
 * @license
 * Copyright (C) 2019–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const errorsFactory = require('@utils/errorsHandling').factory;

/**
 * @typedef {import('@repositories/users.repository')} UsersRepository
 */

let AUTHORIZATION_SERVICE;

const getAuthorizationService = function (usersRepository) {
  if (!AUTHORIZATION_SERVICE) {
    AUTHORIZATION_SERVICE = new AuthorizationService(usersRepository);
  }
  return AUTHORIZATION_SERVICE;
};

class AuthorizationService {
  /**
   * @type {UsersRepository}
   */
  usersRepository;

  /**
   * @param {UsersRepository} usersRepository
   */
  constructor (usersRepository) {
    this.usersRepository = usersRepository;
  }

  /**
   * @param {Permission} permission
   * @returns {any}
   */
  verifyIsAllowedTo (permission) {
    return function (req, res, next) {
      try {
        let permissionsGroup;
        if (req.path.startsWith('/users')) {
          permissionsGroup = 'users';
        } else if (req.path.startsWith('/platform-users')) {
          permissionsGroup = 'platformUsers';
        } else {
          permissionsGroup = 'settings';
        }

        const username = res.locals.username;
        const user = this.usersRepository.findUser(username);

        if (!user) {
          throw new Error();
        }

        AuthorizationService.checkHasPermissionsOnGroup(user, permissionsGroup);
        AuthorizationService.checkHasPermission(permission, user.permissions[permissionsGroup]);
        next();
      } catch (err) {
        next(errorsFactory.unauthorized('Insufficient permissions'));
      }
    }.bind(this);
  }

  /**
   * @static
   * @returns {(req: any, res: any, next: any) => void}
   */
  static verifyChangesItself () {
    return function (req, res, next) {
      const usernameFromToken = res.locals.username;
      const usernameFromPath = req.params.username;

      if (!usernameFromToken || usernameFromToken !== usernameFromPath) {
        throw errorsFactory.unauthorized('Insufficient permissions');
      }
      next();
    };
  }

  /**
   * @returns {any}
   */
  verifyOldPasswordValid () {
    return function (req, res, next) {
      const { username } = res.locals;
      const { oldPassword, newPassword, newPasswordCheck } = req.body;
      const user = {
        username,
        password: oldPassword
      };
      const passwordValid = this.usersRepository.isPasswordValid(user);
      if (!passwordValid) {
        throw errorsFactory.unauthorized('Invalid password');
      }
      if (newPassword !== newPasswordCheck) {
        throw errorsFactory.invalidInput('Passwords do not match');
      }
      next();
    }.bind(this);
  }

  /**
   * @returns {any}
   */
  verifyGivenPermissionsNotExceedOwned () {
    return function (req, res, next) {
      try {
        const username = res.locals.username;
        const user = this.usersRepository.findUser(username);

        if (!user) {
          throw new Error();
        }

        AuthorizationService.checkHasPermissionsOnGroup(user, 'users');

        const userToCreatePermissions = req.body.permissions;
        for (const permissionsGroup of ['users', 'settings', 'platformUsers']) {
          for (const permission of userToCreatePermissions[permissionsGroup]) {
            AuthorizationService.checkHasPermission(
              permission,
              user.permissions[permissionsGroup]
            );
          }
        }

        next();
      } catch (err) {
        next(errorsFactory.unauthorized('Insufficient permissions'));
      }
    }.bind(this);
  }

  /**
   * @static
   * @param {Permission} expectedPermission
   * @param {Permission[]} permissions
   * @returns {void}
   */
  static checkHasPermission (expectedPermission, permissions) {
    if (!permissions.includes(expectedPermission)) {
      throw new Error();
    }
  }

  /**
   * @static
   * @param {UserNoPass} user
   * @param {PermissionsGroup} group
   * @returns {void}
   */
  static checkHasPermissionsOnGroup (user, group) {
    if (!user || !user.permissions || !user.permissions[group]) {
      throw new Error();
    }
  }
}

module.exports = {
  getAuthorizationService,
  AuthorizationService
};
