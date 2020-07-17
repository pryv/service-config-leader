// @flow

const errorsFactory = require('@utils/errorsHandling').factory;
const { Permission } = require('@models/permissions.model');
const { IUsersRepository } = require('@repositories/users.repository');

export interface IPermissionsVerificator {
  hasPermission(permission: Permission): void;
  changesItself(): void;
}

let PERMISSIONS_VERIFICATOR: IPermissionsVerificator;

export const getPermissionsVerificator = function(usersRepository: IUsersRepository) {
  if(!PERMISSIONS_VERIFICATOR) {
    PERMISSIONS_VERIFICATOR = new PermissionsVerificator(usersRepository);
  }
  return PERMISSIONS_VERIFICATOR;
};

class PermissionsVerificator implements IPermissionsVerificator {
  usersRepository: IUsersRepository;

  constructor(usersRepository: IUsersRepository) {
    this.usersRepository = usersRepository;
  }
  
  hasPermission(permission: Permission) {
    return function (req: Request, res: Response, next: NextFunction) {
      try {
        const permissionsGroup = req.path.startsWith('/users') ? 'users' : 'settings';
        const username = res.locals.username;
        const user = this.usersRepository.findUser(username);
        if(!user || !user.permissions || !user.permissions[permissionsGroup]) {
          throw new Error();
        }

        this.checkHasPermission(permission, user.permissions[permissionsGroup]);
      } catch (err) {
        throw errorsFactory.unauthorized('Insufficient permissions');
      }
      next();
    }.bind(this);
  }

  changesItself() {
    return function (req: Request, res: Response, next: NextFunction) {
      const usernameFromToken = res.locals.username;
      const usernameFromPath = req.params.username;

      if (!usernameFromToken || (usernameFromToken !== usernameFromPath)) {
        throw errorsFactory.unauthorized('Insufficient permissions');
      }
      next();
    };
  }

  checkHasPermission(expectedPermission: string, permissions: string[]) {
    if (!permissions.includes(expectedPermission)) {
      throw new Error();
    }
  }
}
