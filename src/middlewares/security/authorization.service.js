// @flow

const errorsFactory = require('@utils/errorsHandling').factory;
import type { Permission } from '@models/permissions.model';
const { UsersRepository } = require('@repositories/users.repository');
import type {
  User,
  UserNoPass,
  UserNoPerms,
  UserPasswordChange,
} from '@models/user.model';
import type { PermissionsGroup, Permissions } from '@models/permissions.model';

let AUTHORIZATION_SERVICE: AuthorizationService;

export const getAuthorizationService = function (
  usersRepository: UsersRepository
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
      next: express$NextFunction
    ) {
      try {
        const permissionsGroup: PermissionsGroup = req.path.startsWith('/users')
          ? 'users'
          : 'settings';
        const username = ((res.locals.username: any): string);
        const user = this.usersRepository.findUser(username);

        if (!user) {
          throw new Error();
        }

        this.checkHasPermissionsOnGroup(user, permissionsGroup);
        this.checkHasPermission(permission, user.permissions[permissionsGroup]);
        next();
      } catch (err) {
        next(errorsFactory.unauthorized('Insufficient permissions'));
      }
    }.bind(this);
  }

  verifyChangesItself() {
    return function (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
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
      next: express$NextFunction
    ) {
      const username = (res.locals: any).username;
      const oldPassword = ((req.body: any): UserPasswordChange).oldPassword;
      const newPassword = ((req.body: any): UserPasswordChange).newPassword;
      const newPasswordCheck = ((req.body: any): UserPasswordChange)
        .newPasswordCheck;

      const user: UserNoPerms = ({
        username: username,
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
      next: express$NextFunction
    ) {
      try {
        const username = ((res.locals.username: any): string);
        const user = this.usersRepository.findUser(username);

        if (!user) {
          throw new Error();
        }

        this.checkHasPermissionsOnGroup(user, 'users');

        const userToCreatePermissions: Permissions = ((req.body: any): User)
          .permissions;
        for (const permissionsGroup of ['users', 'settings']) {
          for (const permission of userToCreatePermissions[permissionsGroup]) {
            this.checkHasPermission(
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

  checkHasPermission(
    expectedPermission: Permission,
    permissions: Permission[]
  ) {
    if (!permissions.includes(expectedPermission)) {
      throw new Error();
    }
  }

  checkHasPermissionsOnGroup(user: UserNoPass, group: PermissionsGroup): void {
    if (!user || !user.permissions || !user.permissions[group]) {
      throw new Error();
    }
  }
}
