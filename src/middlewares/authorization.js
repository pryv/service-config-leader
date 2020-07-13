// @flow

const errorsFactory = require('../utils/errorsHandling').factory;

// Middleware that authenticates requesting followers
// 
module.exports = (settings: Object) => {
  return (req: express$Request, res: express$Response, next: express$NextFunction) => {
    const auth = req.headers.authorization || req.query.auth;
    if (auth == null) {
      return next(errorsFactory.unauthorized("Missing 'Authorization' header or 'auth' query parameter."));
    }
    
    const authorizedFollowers = settings.get('followers');
    console.log(authorizedFollowers);
    if (authorizedFollowers == null || authorizedFollowers[auth] == null) {
      return next(errorsFactory.unauthorized('Invalid follower key.'));
    }

    // Set role of authorized machine in the context
    req.context = Object.assign({}, req.context, {role: authorizedFollowers[auth].role});

    next();
  };
};
