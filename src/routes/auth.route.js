const { createValidator } = require('express-joi-validation');
const { sign } = require('jsonwebtoken');
const nconfSettings = require('@root/settings').getSettings();
const verifyToken = require('@middlewares/security/token.verification');
const { userLoginSchema } = require('./validation/user.schema');

const validator = createValidator();

module.exports = function (expressApp, usersRepository, tokensRepository) {
  expressApp.post('/auth/login', validator.body(userLoginSchema), (req, res, next) => {
    const foundUser = usersRepository.findUser(req.body.username);
    if (!foundUser || Object.keys(foundUser).length === 0) {
      res.status(404).json(`User ${req.params.username} not found`);
      return;
    }

    const passwordCorrect = usersRepository.isPasswordValid(req.body);
    if (!passwordCorrect) {
      res.status(401).json('Authentication failed');
      return;
    }

    const token = sign(
      { username: foundUser.username, permissions: foundUser.permissions },
      nconfSettings.get('internals:configLeaderTokenSecret'),
      { expiresIn: '24h' }
    );
    res.status(200).json({ token });
    next();
  });

  expressApp.post('/auth/logout', verifyToken(tokensRepository), (req, res, next) => {
    const foundUser = usersRepository.findUser(res.locals.username);
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
