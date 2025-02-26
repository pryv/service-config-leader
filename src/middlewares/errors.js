/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const errorsHandling = require('@utils/errorsHandling');
const errorsFactory = errorsHandling.factory;
const logging = require('@utils/logging');
const logger = logging.getLogger('errors');

module.exports = (error, req, res, next) => {
  logger.error(`Error: ${error.message}`);
  if (!Object.hasOwnProperty.call(error, 'httpStatus')) {
    error = errorsFactory.unexpectedError(error);
  }
  res
    .status(error.httpStatus || 500)
    .json({ error: { message: error.message } });
};
