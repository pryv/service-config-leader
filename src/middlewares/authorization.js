/**
 * @license
 * Copyright (C) 2019–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const errorsFactory = require('@utils/errorsHandling').factory;
// Middleware that authenticates requesting followers
//
module.exports = (settings) => (req, res, next) => {
  const auth = req.headers.authorization || req.query.auth;
  if (auth == null) {
    return next(
      errorsFactory.unauthorized(
        "Missing 'Authorization' header or 'auth' query parameter."
      )
    );
  }
  const authorizedFollowers = settings.get('followers');
  if (authorizedFollowers == null || authorizedFollowers[auth] == null) {
    return next(errorsFactory.unauthorized('Invalid follower key.'));
  }
  // Set role of authorized machine in the context
  req.context = { ...req.context, role: authorizedFollowers[auth].role };
  return next();
};
