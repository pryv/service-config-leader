// @flow

const { verify } = require('jsonwebtoken');
const errorsFactory = require('@utils/errorsHandling').factory;
const { TokensRepository } = require('@repositories/tokens.repository');
const nconfSettings = (new (require('@root/settings'))()).store;

export const verifyToken = (tokensRepository: TokensRepository) =>
  function (
    req: express$Request,
    res: express$Response,
    next: express$NextFunction
  ) {
    try {
      const token = req.headers.authorization;

      if (tokensRepository.contains(token)) {
        throw new Error();
      }

      const user = verify(
        token,
        nconfSettings.get('internals:configLeaderTokenSecret') || '',
        {
          ignoreExpiration: false,
        }
      );
      res.locals.username = user.username;
    } catch (err) {
      throw errorsFactory.unauthorized('Invalid token');
    }
    next();
  };
