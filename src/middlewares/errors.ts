const errorsHandling = require('@utils/errorsHandling');

const errorsFactory = errorsHandling.factory;
const { ApiError } = errorsHandling;
const logging = require('@utils/logging');

const logger = logging.getLogger('errors');

module.exports = (
  error: Error | ApiError,
  req: express$Request,
  res: express$Response,
  // eslint-disable-next-line no-unused-vars
  next: express$NextFunction,
) => {
  logger.error(`Error: ${error.message}`);

  if (!Object.hasOwnProperty.call(error, 'httpStatus')) {
    error = errorsFactory.unexpectedError(error);
  }

  res
    .status((error as any as ApiError).httpStatus || 500)
    .json({ error: { message: error.message } });
};
