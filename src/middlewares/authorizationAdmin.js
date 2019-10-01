// @flow

const errorsFactory = require('../utils/errorsHandling').factory;

// Middleware that authenticates platform administrators
// 
module.exports = (settings: Object) => {
  return (req: express$Request, res: express$Response, next: express$NextFunction) => {
    const adminKey = settings.get('adminKey');

    if (adminKey == null) {
      return next(errorsFactory.unauthorized("Please provide an administration key as the 'adminKey' setting."));
    }

    const auth = req.headers.authorization || req.query.auth;
    if (auth == null) {
      return next(errorsFactory.unauthorized("Missing 'Authorization' header or 'auth' query parameter."));
    }

    if (auth !== adminKey) {
      return next(errorsFactory.unauthorized('Invalid admin key.'));
    }

    next();
  };
};
