const { verify } = require('jsonwebtoken');
const errorsFactory = require('../../utils/errorsHandling').factory;
const { ITokensRepository } = require("../../repositories/tokens.repository");

export const verifyToken = function (req: Request, res: Response, next: NextFunction, tokensRepository: ITokensRepository) {
  try {
    const token = req.headers.authorization;

    if(tokensRepository.contains(token)) {
      throw new Error();
    }

    const user = verify(token, process.env.SECRET || '', { ignoreExpiration: false });
    res.locals.username = user.username;
    res.locals.permissions = user.permissions;
  } catch (err) {
    throw errorsFactory.unauthorized("Invalid token");
  }
  next();
};