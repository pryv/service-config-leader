// @flow

const { createValidator } = require('express-joi-validation');
const { createUserSchema, updatePermissionsSchema } = require('./validation/user.schema');
const { IUsersRepository } = require('@repositories/users.repository');
const { verifyToken } = require('@middlewares/security/token.verification');
const { validatePermissions } = require('./validation/permissions.validation');
const { verifyPermissions } = require('@middlewares/security/authorization.verification');
const { USERS_PERMISSIONS } = require('@models/permissions.model');

const validator = createValidator();

module.exports = function (expressApp: express$Application,
  usersRepository: IUsersRepository,
  tokensRepository: ITokensRepository) {

  expressApp.all('/users*',
    (req: express$Request, res: express$Response, next: express$NextFunction) =>
      verifyToken(req, res, next, tokensRepository));

  expressApp.post('/users', verifyPermissions(USERS_PERMISSIONS.CREATE), validator.body(createUserSchema),
    validatePermissions,
    function (req: express$Request, res: express$Response) {
      const createdUser = usersRepository.createUser(req.body);
      res.status(201).json(createdUser);
    });

  expressApp.get('/users', verifyPermissions(USERS_PERMISSIONS.READ),
    function (req: express$Request, res: express$Response) {
      const retrievedUsers = usersRepository.findAllUsers();
      res.status(200).json(retrievedUsers);
    });

  expressApp.get('/users/:username', verifyPermissions(USERS_PERMISSIONS.READ),
    function (req: express$Request, res: express$Response) {
      const retrievedUser = usersRepository.findUser(req.params.username);
      if (!retrievedUser || Object.keys(retrievedUser).length == 0) {
        res.status(404).json(`User ${req.params.username} not found`);
      } else {
        res.status(200).json(retrievedUser);
      }
    });

  expressApp.post('/users/:username/reset-password',
    verifyPermissions(USERS_PERMISSIONS.RESET_PASSWORD),
    function (req: express$Request, res: express$Response) {
      const updatedUser = usersRepository.resetPassword(req.params.username);
      res.status(200).json(updatedUser);
    });

  expressApp.put('/users/:username/permissions',
    verifyPermissions(USERS_PERMISSIONS.CHANGE_PERMISSIONS),
    validator.body(updatePermissionsSchema),
    function (req: express$Request, res: express$Response) {
      const updatedUser = usersRepository.updateUser(req.params.username, req.body);
      res.status(200).json(updatedUser);
    });

  expressApp.delete('/users/:username',
    verifyPermissions(USERS_PERMISSIONS.DELETE),
    function (req: express$Request, res: express$Response) {
      const deletedUserName = usersRepository.deleteUser(req.params.username);
      if (!deletedUserName) {
        res.status(404).json(`User ${req.params.username} not found`);
      } else {
        res.status(200).json({ username: deletedUserName });
      }
    });
};