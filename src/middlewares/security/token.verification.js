/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
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
