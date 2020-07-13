// @flow

const { createValidator } = require('express-joi-validation');
const { createUserSchema, updatePermissionsSchema } = require('./validation/user.schema');
const { IUsersRepository } = require("./../../src/repositories/users.repository");
const { verifyToken } = require('./../middlewares/security/token.verification');
const { validatePermissions } = require('./validation/permissions.validation');
const { verifyPermissionsOnUsers } = require("./../middlewares/security/authorization.verification");

const validator = createValidator()

module.exports = function (expressApp: express$Application,
  usersRepository: IUsersRepository,
  tokensRepository: ITokensRepository,
  allowedSettingsPermissionsKeys: Array) {

  expressApp.all('/users*',
    (req: express$Request, res: express$Response, next: express$NextFunction) => 
      verifyToken(req, res, next, tokensRepository),
    verifyPermissionsOnUsers);

  expressApp.post('/users', validator.body(createUserSchema),
    (req: express$Request, res: express$Response, next: express$NextFunction) => 
      validatePermissions(req, res, next, allowedSettingsPermissionsKeys),
    function (req: express$Request, res: express$Response, next: express$NextFunction) {
      const createdUser = usersRepository.createUser(req.body);
      res.status(201).json(createdUser);
    });

  expressApp.get('/users', function (req: express$Request, res: express$Response, next: express$NextFunction) {
    const retrievedUsers = usersRepository.findAllUsers();
    res.status(200).json(retrievedUsers);
  });

  expressApp.get('/users/:username', function (req: express$Request, res: express$Response, next: express$NextFunction) {
    const retrievedUser = usersRepository.findUser(req.params.username);
    if (!retrievedUser || Object.keys(retrievedUser).length == 0) {
      res.status(404).json(`User ${req.params.username} not found`);
    } else {
      res.status(200).json(retrievedUser);
    }
  });

  expressApp.post('/users/:username/reset-password',
    function (req: express$Request, res: express$Response, next: express$NextFunction) {
      const updatedUser = usersRepository.resetPassword(req.params.username);
      res.status(200).json(updatedUser);
  });

  expressApp.put('/users/:username/permissions', validator.body(updatePermissionsSchema),
  (req: express$Request, res: express$Response, next: express$NextFunction) => 
    validatePermissions(req, res, next, allowedSettingsPermissionsKeys),
  function (req: express$Request, res: express$Response, next: express$NextFunction) {
    const updatedUser = usersRepository.updateUser(req.params.username, req.body);
    res.status(200).json(updatedUser);
});

  expressApp.delete('/users/:username', function (req: express$Request, res: express$Response, next: express$NextFunction) {
    const deletedUserName = usersRepository.deleteUser(req.params.username);
    if (!deletedUserName) {
      res.status(404).json(`User ${req.params.username} not found`);
    } else {
      res.status(200).json({ username: deletedUserName });
    }
  });
}