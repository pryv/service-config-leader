/**
 * @license
 * Copyright (C) 2019–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const { verify } = require('jsonwebtoken');
const errorsFactory = require('@utils/errorsHandling').factory;
const nconfSettings = require('@root/settings').getSettings();

module.exports = (tokensRepository) => function (req, res, next) {
  try {
    const token = req.headers.authorization;

    if (tokensRepository.contains(token)) {
      throw new Error();
    }

    const user = verify(
      token,
      nconfSettings.get('internals:configLeaderTokenSecret') || '',
      {
        ignoreExpiration: false
      }
    );
    res.locals.username = user.username;
  } catch (err) {
    throw errorsFactory.unauthorized('Invalid token');
  }
  next();
};
