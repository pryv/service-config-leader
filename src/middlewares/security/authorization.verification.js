// @flow

const errorsFactory = require('@utils/errorsHandling').factory;
const { Permission } = require('@models/permissions.model');

export const verifyPermissions = (permission: Permission) =>
  function (req: Request, res: Response, next: NextFunction) {
    try {
      const permissionsGroup = req.path.startsWith('/users') ? 'users' : 'settings';
      const permissionsFromToken = res.locals.permissions;
      if (!permissionsFromToken) {
        throw new Error();
      }
      checkHasPermission(permission, permissionsFromToken[permissionsGroup]);
    } catch (err) {
      throw errorsFactory.unauthorized('Insufficient permissions');
    }
    next();
  };

const checkHasPermission = function (expectedPermission: string, permissions: string[]): void {
  if (!permissions.includes(expectedPermission)) {
    throw new Error();
  }
};
