/**
 * @license
 * Copyright (C) 2019–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
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
