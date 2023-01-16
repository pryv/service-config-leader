const errorsHandling = require('@utils/errorsHandling');
const errorsFactory = errorsHandling.factory;
const { ApiError } = errorsHandling;
const logging = require('@utils/logging');
const logger = logging.getLogger('errors');
module.exports = (
  error,
  req,
  res,
  // eslint-disable-next-line no-unused-vars
  next
) => {
  logger.error(`Error: ${error.message}`);
  if (!Object.hasOwnProperty.call(error, 'httpStatus')) {
    error = errorsFactory.unexpectedError(error);
  }
  res
    .status(error.httpStatus || 500)
    .json({ error: { message: error.message } });
};
