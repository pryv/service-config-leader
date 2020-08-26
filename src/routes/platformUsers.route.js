// @flow

const { UsersRepository } = require('@repositories/users.repository');
const { TokensRepository } = require('@repositories/tokens.repository');
const { verifyToken } = require('@middlewares/security/token.verification');
const {
  getAuthorizationService,
  AuthorizationService,
} = require('@middlewares/security/authorization.service');
const { PLATFORM_USERS_PERMISSIONS } = require('@models/permissions.model');

module.exports = function (
  expressApp: express$Application,
  usersRepository: UsersRepository,
  tokensRepository: TokensRepository
) {
  const authorizationService: AuthorizationService = getAuthorizationService(
    usersRepository
  );

  expressApp.all('/platform-users*', verifyToken(tokensRepository));

  expressApp.get(
    '/platform-users/:id',
    authorizationService.verifyIsAllowedTo(PLATFORM_USERS_PERMISSIONS.READ),
    function (req: express$Request, res: express$Response) {
      const retrievedUser = {
        username: 'user',
        password: 'pass',
        email: 'mail@xx.com',
        appId: 'someappidxx',
        invitationToken: 'sometoken',
        referer: 'someref',
        languageCode: 'en',
      };
      res.status(200).json(retrievedUser);
    }
  );

  expressApp.delete(
    '/platform-users/:id',
    authorizationService.verifyIsAllowedTo(PLATFORM_USERS_PERMISSIONS.DELETE),
    function (req: express$Request, res: express$Response) {
      const deletedUser = {
        username: 'user',
        password: 'pass',
        email: 'mail@xx.com',
        appId: 'someappidxx',
        invitationToken: 'sometoken',
        referer: 'someref',
        languageCode: 'en',
      };
      res.status(200).json(deletedUser);
    }
  );
};
