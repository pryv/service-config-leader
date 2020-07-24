// @flow

const errorsFactory = require("@utils/errorsHandling").factory;
import type { Permission } from "@models/permissions.model";
const { UsersRepository } = require("@repositories/users.repository");
import { User } from "@models/user.model";

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
        const permissionsGroup = req.path.startsWith("/users")
          ? "users"
          : "settings";
        const username = ((res.locals.username: any): string);
        const user = this.usersRepository.findUser(username);
        if (!user || !user.permissions || !user.permissions[permissionsGroup]) {
          throw new Error();
        }

        this.checkHasPermission(permission, user.permissions[permissionsGroup]);
        next();
      } catch (err) {
        next(errorsFactory.unauthorized("Insufficient permissions"));
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
        throw errorsFactory.unauthorized("Insufficient permissions");
      }
      next();
    };
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
        if (!user || !user.permissions || !user.permissions.users) {
          throw new Error();
        }

        const userToCreatePermissions = ((req.body: any): User).permissions;
        for (const permissionsGroup of ["users", "settings"]) {
          for (const permission of userToCreatePermissions[permissionsGroup]) {
            this.checkHasPermission(
              permission,
              user.permissions[permissionsGroup]
            );
          }
        }

        next();
      } catch (err) {
        next(errorsFactory.unauthorized("Insufficient permissions"));
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
}
