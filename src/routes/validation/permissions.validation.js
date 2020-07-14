const errorsFactory = require('@utils/errorsHandling').factory;
const { SETTINGS_PERMISSIONS, USERS_PERMISSIONS } = require("@models/permissions.model");

export const validatePermissions = 
  function (req: express$Request, res: express$Response, next: express$NextFunction, allowedSettingsPermissionsKeys: Array) {
    const permissions = req.body.permissions;
    
    if(!permissions || Object.keys(permissions).length == 0) {
      throw errorsFactory.unauthorized("Permissions property not provided");
    }

    if(containsDuplicates(Object.keys(permissions))) {
      throw errorsFactory.unauthorized("Permissions contain duplicate entries");
    }

    for(const permissionKey of Object.keys(permissions)) {
      if(!allowedSettingsPermissionsKeys.includes(permissionKey) && permissionKey !== "users") {
        throw errorsFactory.unauthorized(`Invalid permission key: ${permissionKey}`);
      }

      const permissionsArray = permissions[permissionKey];
      if(!Array.isArray(permissionsArray)) {
        throw errorsFactory
          .unauthorized(`Invalid permissions format: ${permissionsArray}, for key: ${permissionKey}. Should be an array`);
      }

      if(permissionKey === "users") {
        permissionsArray.map(permissionType => {
          if(!Object.values(USERS_PERMISSIONS).includes(permissionType)) {
            throw errorsFactory.unauthorized(`Invalid permission type: ${permissionType}, for key: ${permissionKey}`);
          }
        });
      } else {
        permissionsArray.map(permissionType => {
          if(!Object.values(SETTINGS_PERMISSIONS).includes(permissionType)) {
            throw errorsFactory.unauthorized(`Invalid permission type: ${permissionType}, for key: ${permissionKey}`);
          }
        });
      }
    }
    next();
  };

function containsDuplicates(array){
    return new Set(array).size !== array.length 
}