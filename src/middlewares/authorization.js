// @flow

const errorsFactory = require('../utils/errorsHandling').factory;

// Middleware that authenticates requesting machines based on machine keys
// 
module.exports = (settings: Object) => {
  return (req: express$Request, res: express$Response, next: express$NextFunction) => {
    const machineKey = req.headers.authorization || req.query.auth;
    if (machineKey == null) {
      return next(errorsFactory.unauthorized("Missing 'Authorization' header or 'auth' query parameter."));
    }
    
    const authorizedMachines = settings.get('machines');
    if (authorizedMachines == null || authorizedMachines[machineKey] == null) {
      return next(errorsFactory.unauthorized('Provided machine key is not authorized.'));
    }

    // Set role of authorized machine in the context
    req.context = Object.assign({}, req.context, {role: authorizedMachines[machineKey]});

    next();
  };
};
