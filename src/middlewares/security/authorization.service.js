// @flow

import type { Permission, PermissionsGroup, Permissions } from '@models/permissions.model';
import type {
  User,
  UserNoPass,
  UserNoPerms,
  UserPasswordChange,
} from '@models/user.model';

const errorsFactory = require('@utils/errorsHandling').factory;
const UsersRepository = require('@repositories/users.repository');

let AUTHORIZATION_SERVICE: AuthorizationService;

export const getAuthorizationService = function (
  usersRepository: UsersRepository,
) {
  if (!AUTHORIZATION_SERVICE) {
    AUTHORIZATION_SERVICE = new AuthorizationService(usersRepository);
  }
  return AUTHORIZATION_SERVICE;
};

export class AuthorizationService {
  usersRepository: UsersRepository;

  constructor(usersRepository: UsersRepository) {
    this.usersRepository = usersRepository;
  }

  verifyIsAllowedTo(permission: Permission) {
    return function (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction,
    ) {
      try {
        let permissionsGroup: PermissionsGroup;
        if (req.path.startsWith('/users')) {
          permissionsGroup = 'users';
        } else if (req.path.startsWith('/platform-users')) {
          permissionsGroup = 'platformUsers';
        } else {
          permissionsGroup = 'settings';
        }

        const username = ((res.locals.username: any): string);
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

  static verifyChangesItself() {
    return function (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction,
    ) {
      const usernameFromToken = res.locals.username;
      const usernameFromPath = req.params.username;

      if (!usernameFromToken || usernameFromToken !== usernameFromPath) {
        throw errorsFactory.unauthorized('Insufficient permissions');
      }
      next();
    };
  }

  verifyOldPasswordValid() {
    return function (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction,
    ) {
      const { username } = res.locals;
      const {
        oldPassword,
        newPassword,
        newPasswordCheck,
      } = ((req.body: any): UserPasswordChange);

      const user: UserNoPerms = ({
        username,
        password: oldPassword,
      }: UserNoPerms);
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

  verifyGivenPermissionsNotExceedOwned() {
    return function (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction,
    ) {
      try {
        const username = ((res.locals.username: any): string);
        const user = this.usersRepository.findUser(username);

        if (!user) {
          throw new Error();
        }

        AuthorizationService.checkHasPermissionsOnGroup(user, 'users');

        const userToCreatePermissions: Permissions = ((req.body: any): User)
          .permissions;
        for (const permissionsGroup of ['users', 'settings', 'platformUsers']) {
          for (const permission of userToCreatePermissions[permissionsGroup]) {
            AuthorizationService.checkHasPermission(
              permission,
              user.permissions[permissionsGroup],
            );
          }
        }

        next();
      } catch (err) {
        next(errorsFactory.unauthorized('Insufficient permissions'));
      }
    }.bind(this);
  }

  static checkHasPermission(
    expectedPermission: Permission,
    permissions: Permission[],
  ) {
    if (!permissions.includes(expectedPermission)) {
      throw new Error();
    }
  }

  static checkHasPermissionsOnGroup(user: UserNoPass, group: PermissionsGroup): void {
    if (!user || !user.permissions || !user.permissions[group]) {
      throw new Error();
    }
  }
}
