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
const { getAuditLogger, DELETE_USER_ACTION } = require('@utils/auditLogger');

module.exports = function (
  expressApp: express$Application,
  settings: Object,
  platformSettings: Object,
  usersRepository: UsersRepository,
  tokensRepository: TokensRepository
) {
  const authorizationService: AuthorizationService = getAuthorizationService(
    usersRepository
  );
  const auditLogger = getAuditLogger(settings.get('logs:audit:filePath'));

  expressApp.all('/platform-users*', verifyToken(tokensRepository));

  expressApp.get(
    '/platform-users/:username',
    authorizationService.verifyIsAllowedTo(PLATFORM_USERS_PERMISSIONS.READ),
    async function (req: express$Request, res: express$Response) {
      const authKey = settings.get('internals:REGISTER_SYSTEM_KEY_1');
      const registerUrl = settings.get('registerUrl');
      try {
        const getResponse = await request
          .get(`${registerUrl}/admin/users/${req.params.username}`)
          .set('Authorization', authKey);
        res.status(200).json({ user: getResponse.body });
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
      const accountDeletions: Array<string> = platformSettings.get('vars:API_SETTINGS:settings:ACCOUNT_DELETION:value');
      const isDeleteAllowed: boolean = accountDeletions.includes('adminToken');
      if (! isDeleteAllowed) {
        const error: any = new Error('Platform user deletion is disabled. Refer to your platform configuration.')
        error.httpStatus = 403;
        return next(error);
      }
      const usernameToDelete = req.params.username;
      const authKeyCore = settings.get('internals:CORE_SYSTEM_KEY');
      const authKeyReg = settings.get('internals:REGISTER_SYSTEM_KEY_1');
      const registerUrl = settings.get('registerUrl');

      const followers = settings.get('followers');
      if (followers == null) {
        return next(new Error('Missing followers settings'));
      }
      const cores = Object.entries(followers)
        .filter((follower) => (follower[1].role === 'core') || (follower[1].role === 'singlenode'))
        .map((core) => core[1]);

      if (cores == null || cores.length === 0) {
        return next(
          new Error('No core machines defined in followers settings')
        );
      }

      try {
        const deleteFromCoresPromises = [];
        for (const core of cores) {
          if (core.role === 'singlenode') {
            deleteFromCoresPromises.push(
              request
                .delete(`http://core:3000/users/${usernameToDelete}`)
                .set('Authorization', authKeyCore)
            );
          } else {
            deleteFromCoresPromises.push(
              request
                .delete(`${core.url}/users/${usernameToDelete}`)
                .set('Authorization', authKeyCore)
            );
          }
        }

        const res = await bluebird.any(deleteFromCoresPromises);
      } catch (err) {
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
        const res = await request
          .delete(`${registerUrl}/users/${usernameToDelete}?onlyReg=true`)
          .set('Authorization', authKeyReg);
      } catch (err) {
        return res.status(err.status).json(err.response || err.message);
      }

      auditLogger.appendToLogFile(res.locals.username, DELETE_USER_ACTION, usernameToDelete)
      
      res.status(200).json({username: usernameToDelete});
    }
  );
};
