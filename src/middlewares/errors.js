// @flow

const errorsHandling = require('@utils/errorsHandling');
const errorsFactory = errorsHandling.factory;
const ApiError = errorsHandling.ApiError;
const logging = require('@utils/logging');
const logger = logging.getLogger('errors');

// Error middleware.
// NOTE: next is not used, since the request is terminated on all errors. 
/*eslint-disable no-unused-vars*/
module.exports = (error: Error | ApiError, req: express$Request, res: express$Response, next: express$NextFunction) => {
  logger.error('Error: ' + error.message, error);

  if (!error.hasOwnProperty("httpStatus")) {
    error = errorsFactory.unexpectedError(error);
  }

  res
    .status(error.httpStatus || 500)
    .json({error: { message: error.message }});
};
