// @flow

const errorsFactory = require('@utils/errorsHandling').factory;
const { USERS_PERMISSIONS } = require('@models/permissions.model');

export const verifyPermissionsOnUsers = function (req: Request, res: Response, next: NextFunction) {

  const checkHasPermission = function (expectedPermission: string, permissions: string[]): void {
    if (!permissions.includes(expectedPermission)) {
      throw new Error();
    }
  };

  try {
    const path = req.path;
    const method = req.method;

    const reqParam = req.params[0];
    const username = reqParam.substring(reqParam.indexOf('/') + 1,
      reqParam.lastIndexOf('/') > 0 ? reqParam.lastIndexOf('/') : reqParam.length);

    const permissionsFromToken = res.locals.permissions;

    if (!permissionsFromToken) {
      throw new Error();
    }

    // /users POST -> create
    // /users GET -> read

    // /users/:username GET -> read
    // /users/:username DELETE -> delete

    // /users/:username/reset-password POST -> resetPassword
    // /users/:username/permissions PUT -> changePermissions

    if (username) {
      if (path.endsWith('reset-password')) {
        checkHasPermission(USERS_PERMISSIONS.RESET_PASSWORD, permissionsFromToken.users);
        next();
      }
      if (path.endsWith('permissions')) {
        checkHasPermission(USERS_PERMISSIONS.CHANGE_PERMISSIONS, permissionsFromToken.users);
        next();
      }
      switch (method) {
        case 'GET':
          checkHasPermission(USERS_PERMISSIONS.READ, permissionsFromToken.users);
          break;
        case 'DELETE':
          checkHasPermission(USERS_PERMISSIONS.DELETE, permissionsFromToken.users);
          break;
      }
    } else {
      switch (method) {
        case 'POST':
          checkHasPermission(USERS_PERMISSIONS.CREATE, permissionsFromToken.users);
          break;
        case 'GET':
          checkHasPermission(USERS_PERMISSIONS.READ, permissionsFromToken.users);
          break;
      }
    }
  } catch (err) {
    console.error(err);
    throw errorsFactory.unauthorized('Insufficient permissions');
  }
  next();
};