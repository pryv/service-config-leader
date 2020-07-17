// @flow

const { createValidator } = require('express-joi-validation');
const { userLoginSchema } = require('./validation/user.schema');
const { IUsersRepository } = require('@repositories/users.repository');
const { sign } = require('jsonwebtoken');
const { ITokensRepository } = require('@repositories/tokens.repository');

const validator = createValidator();

module.exports = function (expressApp: express$Application, 
  usersRepository: IUsersRepository, 
  tokensRepository: ITokensRepository) {

  expressApp.post('/auth/login', validator.body(userLoginSchema),
    function (req: express$Request, res: express$Response, next: express$NextFunction) {
      const foundUser = usersRepository.findUser(req.body.username);
      if(!foundUser || Object.keys(foundUser).length == 0) {
        res.status(404).json(`User ${req.params.username} not found`);
        return;
      }

      const passwordCorrect = usersRepository.checkPassword(req.body);
      if(!passwordCorrect) {
        res.status(401).json('Authentication failed');
        return;
      }

      const token = sign({ username: foundUser.username },
        process.env.SECRET, { expiresIn: '24h' });
      res.status(200).json({ token });
      next();
    });

  expressApp.post('/auth/logout',
    function (req: express$Request, res: express$Response, next: express$NextFunction) {
      const token = req.headers.authorization;
      tokensRepository.blacklist(token);
      res.status(200).json({ token });
      next();
    });
};