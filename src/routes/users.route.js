// @flow

const { createValidator } = require('express-joi-validation');
const { createUserSchema, updatePermissionsSchema, changePasswordSchema } = require('./validation/user.schema');
const { IUsersRepository } = require('@repositories/users.repository');
const { verifyToken } = require('@middlewares/security/token.verification');
const { validatePermissions } = require('./validation/permissions.validation');
const { getPermissionsVerificator, IPermissionsVerificator } = require('@middlewares/security/authorization.verification');
const { USERS_PERMISSIONS } = require('@models/permissions.model');

const validator = createValidator();

module.exports = function (expressApp: express$Application,
  usersRepository: IUsersRepository,
  tokensRepository: ITokensRepository) {

  const permissionsVerificator: IPermissionsVerificator = getPermissionsVerificator(usersRepository);

  expressApp.all('/users*', verifyToken(tokensRepository));

  expressApp.post('/users', permissionsVerificator.hasPermission(USERS_PERMISSIONS.CREATE), validator.body(createUserSchema),
    validatePermissions,
    function (req: express$Request, res: express$Response) {
      const createdUser = usersRepository.createUser(req.body);
      res.status(201).json(createdUser);
    });

  expressApp.get('/users', permissionsVerificator.hasPermission(USERS_PERMISSIONS.READ),
    function (req: express$Request, res: express$Response) {
      const retrievedUsers = usersRepository.findAllUsers();
      res.status(200).json(retrievedUsers);
    });

  expressApp.get('/users/:username', permissionsVerificator.hasPermission(USERS_PERMISSIONS.READ),
    function (req: express$Request, res: express$Response) {
      const retrievedUser = usersRepository.findUser(req.params.username);
      if (!retrievedUser || Object.keys(retrievedUser).length == 0) {
        res.status(404).json(`User ${req.params.username} not found`);
      } else {
        res.status(200).json(retrievedUser);
      }
    });

  expressApp.post('/users/:username/reset-password',
    permissionsVerificator.hasPermission(USERS_PERMISSIONS.RESET_PASSWORD),
    function (req: express$Request, res: express$Response) {
      const updatedUser = usersRepository.resetPassword(req.params.username);
      res.status(200).json(updatedUser);
    });

  expressApp.post('/users/:username/change-password',
    permissionsVerificator.changesItself(),
    validator.body(changePasswordSchema),
    function (req: express$Request, res: express$Response) {
      const updatedUser = usersRepository.updateUser(req.params.username, req.body);
      res.status(200).json(updatedUser);
    });

  expressApp.put('/users/:username/permissions',
    permissionsVerificator.hasPermission(USERS_PERMISSIONS.CHANGE_PERMISSIONS),
    validator.body(updatePermissionsSchema),
    function (req: express$Request, res: express$Response) {
      const updatedUser = usersRepository.updateUser(req.params.username, req.body);
      res.status(200).json(updatedUser);
    });

  expressApp.delete('/users/:username',
    permissionsVerificator.hasPermission(USERS_PERMISSIONS.DELETE),
    function (req: express$Request, res: express$Response) {
      const deletedUserName = usersRepository.deleteUser(req.params.username);
      if (!deletedUserName) {
        res.status(404).json(`User ${req.params.username} not found`);
      } else {
        res.status(200).json({ username: deletedUserName });
      }
    });
};