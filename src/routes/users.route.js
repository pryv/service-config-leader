// @flow

import type {
  User,
  UserOptional,
} from '@models/user.model';

const { createValidator } = require('express-joi-validation');
const UsersRepository = require('@repositories/users.repository');
const TokensRepository = require('@repositories/tokens.repository');
const verifyToken = require('@middlewares/security/token.verification');
const {
  getAuthorizationService,
  AuthorizationService,
} = require('@middlewares/security/authorization.service');
const { USERS_PERMISSIONS } = require('@models/permissions.model');
const {
  createUserSchema,
  updatePermissionsSchema,
  changePasswordSchema,
} = require('./validation/user.schema');

const validator = createValidator();

module.exports = function (
  expressApp: express$Application,
  usersRepository: UsersRepository,
  tokensRepository: TokensRepository,
) {
  const authorizationService: AuthorizationService = getAuthorizationService(
    usersRepository,
  );

  expressApp.all('/users*', verifyToken(tokensRepository));

  expressApp.post(
    '/users',
    authorizationService.verifyIsAllowedTo(USERS_PERMISSIONS.CREATE),
    validator.body(createUserSchema),
    authorizationService.verifyGivenPermissionsNotExceedOwned(),
    (req: express$Request, res: express$Response) => {
      const createdUser = usersRepository.createUser(((req.body: any): User));
      res.status(201).json({ user: createdUser });
    },
  );

  expressApp.get(
    '/users',
    authorizationService.verifyIsAllowedTo(USERS_PERMISSIONS.READ),
    (req: express$Request, res: express$Response) => {
      const retrievedUsers = usersRepository.findAllUsers();
      res.status(200).json({ users: retrievedUsers });
    },
  );

  expressApp.get(
    '/users/:username',
    authorizationService.verifyIsAllowedTo(USERS_PERMISSIONS.READ),
    (req: express$Request, res: express$Response) => {
      const retrievedUser = usersRepository.findUser(req.params.username);
      if (!retrievedUser || Object.keys(retrievedUser).length === 0) {
        res.status(404).json(`User ${req.params.username} not found`);
      } else {
        res.status(200).json({ user: retrievedUser });
      }
    },
  );

  expressApp.post(
    '/users/:username/reset-password',
    authorizationService.verifyIsAllowedTo(USERS_PERMISSIONS.RESET_PASSWORD),
    (req: express$Request, res: express$Response) => {
      const updatedUser = usersRepository.resetPassword(req.params.username);
      res.status(200).json(updatedUser);
    },
  );

  expressApp.post(
    '/users/:username/change-password',
    AuthorizationService.verifyChangesItself(),
    authorizationService.verifyOldPasswordValid(),
    validator.body(changePasswordSchema),
    (req: express$Request, res: express$Response) => {
      const newPassword: UserOptional = {
        password: req.body.newPassword,
      };
      usersRepository.updateUser(
        req.params.username,
        newPassword,
      );
      const token = req.headers.authorization;
      tokensRepository.blacklist(token);
      res.status(200).json({});
    },
  );

  expressApp.put(
    '/users/:username/permissions',
    authorizationService.verifyIsAllowedTo(
      USERS_PERMISSIONS.CHANGE_PERMISSIONS,
    ),
    validator.body(updatePermissionsSchema),
    (req: express$Request, res: express$Response) => {
      const updatedUser = usersRepository.updateUser(
        req.params.username,
        ((req.body: any): UserOptional),
      );
      res.status(200).json({ user: updatedUser });
    },
  );

  expressApp.delete(
    '/users/:username',
    authorizationService.verifyIsAllowedTo(USERS_PERMISSIONS.DELETE),
    (req: express$Request, res: express$Response) => {
      const deletedUserName = usersRepository.deleteUser(req.params.username);
      if (!deletedUserName) {
        res.status(404).json(`User ${req.params.username} not found`);
      } else {
        res.status(200).json({ username: deletedUserName });
      }
    },
  );
};
