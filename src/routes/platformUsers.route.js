// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const request = require('superagent');
const bluebird = require('bluebird');
const logger = require('@utils/logging').getLogger('platform-users');
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
  settings: Object,
  usersRepository: UsersRepository,
  tokensRepository: TokensRepository
) {
  const authorizationService: AuthorizationService = getAuthorizationService(
    usersRepository
  );

  expressApp.all('/platform-users*', verifyToken(tokensRepository));

  expressApp.get(
    '/platform-users/:username',
    authorizationService.verifyIsAllowedTo(PLATFORM_USERS_PERMISSIONS.READ),
    async function (req: express$Request, res: express$Response) {
      const authKey = settings.get('internals:REGISTER_ADMIN_KEY_1');
      const registerUrl = settings.get('registerUrl');
      try {
        const getResponse = await request
          .get(`${registerUrl}/admin/users/${req.params.username}`)
          .set('Authorization', authKey);
        res.status(200).json(getResponse.body);
      } catch (err) {
        logger.warn('Error while deleting user:', err);
        res.status(err.status || 500).json(err.response || err.message);
      }
    }
  );

  expressApp.delete(
    '/platform-users/:username',
    authorizationService.verifyIsAllowedTo(PLATFORM_USERS_PERMISSIONS.DELETE),
    async function (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
    ) {
      const authKeyCore = settings.get('internals:CORE_SYSTEM_KEY');
      const authKeyReg = settings.get('internals:REGISTER_SYSTEM_KEY_1');
      const registerUrl = settings.get('registerUrl');

      const followers = settings.get('followers');
      if (followers == null) {
        return next(new Error('Missing followers settings'));
      }
      const cores = Object.entries(followers)
        .filter((follower) => follower[1].role === 'core')
        .map((core) => core[1]);

      if (cores == null || cores.length === 0) {
        return next(
          new Error('No core machines defined in followers settings')
        );
      }

      try {
        const deleteFromFollowersPromises = [];
        for (const core of cores) {
          deleteFromFollowersPromises.push(
            request
              .delete(`${core.url}/users/${req.params.username}`)
              .set('Authorization', authKeyCore)
          );
        }

        await bluebird.any(deleteFromFollowersPromises);
      } catch (err) {
        // cores failed
        let unexpectedError: ?{};
        err.forEach(error => {
          if (error.status != 404) {
            unexpectedError = error;
          }
        });
        if (unexpectedError != null) {
          logger.warn('Error while deleting user:', unexpectedError);
          return res.status(unexpectedError.status).json(unexpectedError.response || unexpectedError.message);
        } else {
          // continue with call to reg
        }
      }

      try {
        await request
          .delete(`${registerUrl}/users/${req.params.username}?onlyReg=true`)
          .set('Authorization', authKeyReg);
      } catch (err) {
        return res.status(err.status).json(err.response || err.message);
      }
      
      res.status(200).json({username: req.params.username});
    }
  );
};
