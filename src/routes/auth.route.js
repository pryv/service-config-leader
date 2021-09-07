// @flow

import type { User } from '@models/user.model';

const { createValidator } = require('express-joi-validation');
const UsersRepository = require('@repositories/users.repository');
const { sign } = require('jsonwebtoken');
const TokensRepository = require('@repositories/tokens.repository');
const nconfSettings = require('@root/settings')();
const verifyToken = require('@middlewares/security/token.verification');
const { userLoginSchema } = require('./validation/user.schema');

const validator = createValidator();

module.exports = function (
  expressApp: express$Application,
  usersRepository: UsersRepository,
  tokensRepository: TokensRepository,
) {
  expressApp.post('/auth/login', validator.body(userLoginSchema), (
    req: express$Request,
    res: express$Response,
    next: express$NextFunction,
  ) => {
    const foundUser = usersRepository.findUser(
      ((req.body: any): User).username,
    );
    if (!foundUser || Object.keys(foundUser).length === 0) {
      res.status(404).json(`User ${req.params.username} not found`);
      return;
    }

    const passwordCorrect = usersRepository.isPasswordValid(
      ((req.body: any): User),
    );
    if (!passwordCorrect) {
      res.status(401).json('Authentication failed');
      return;
    }

    const token = sign(
      { username: foundUser.username, permissions: foundUser.permissions },
      nconfSettings.get('internals:configLeaderTokenSecret'),
      { expiresIn: '24h' },
    );
    res.status(200).json({ token });
    next();
  });

  expressApp.post('/auth/logout', verifyToken(tokensRepository), (
    req: express$Request,
    res: express$Response,
    next: express$NextFunction,
  ) => {
    const foundUser = usersRepository.findUser(
      ((res.locals: any): User).username,
    );
    if (!foundUser || Object.keys(foundUser).length === 0) {
      res.status(404).json(`User ${req.params.username} not found`);
      return;
    }

    const token = req.headers.authorization;
    tokensRepository.blacklist(token);
    res.status(200).json({ token });
    next();
  });
};
