// @flow

const { verify } = require('jsonwebtoken');
const errorsFactory = require('@utils/errorsHandling').factory;
const { ITokensRepository } = require('@repositories/tokens.repository');

export const verifyToken = (tokensRepository: ITokensRepository) =>
  function (req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization;

      if (tokensRepository.contains(token)) {
        throw new Error();
      }

      const user = verify(token, process.env.SECRET || '', { ignoreExpiration: false });
      res.locals.username = user.username;
    } catch (err) {
      throw errorsFactory.unauthorized('Invalid token');
    }
    next();
  };