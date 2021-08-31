// @flow

const url = require('url');
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
const { getAuditLogger, DELETE_USER_ACTION, MODIFY_USER_ACTION } = require('@utils/auditLogger');
const errors = require('@utils/errorsHandling').factory;

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
    async function (req: express$Request, res: express$Response, next: express$NextFunction) {
      const authKey = settings.get('internals:REGISTER_SYSTEM_KEY_1');
      const registerUrl = settings.get('registerUrl');
      const username = req.params.username;
      try {
        const getResponse = await request
          .get(url.resolve(registerUrl ,`/admin/users/${username}`))
          .set('Authorization', authKey);
        res.status(200).json({ user: getResponse.body });
      } catch (err) {
        if (err.status && err.status === 404) return next(errors.notFound(`user with username: "${username}" not found on register at: ${registerUrl}. Register error: ${err.message}`));
        return next(errors.unexpectedError(new Error(`Error while fetching user on register at: ${registerUrl}. Register error: ${err.message}`)));
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
                .delete(url.resolve(core.url, `/users/${usernameToDelete}`))
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
          .delete(url.resolve(registerUrl, `/users/${usernameToDelete}?onlyReg=true`))
          .set('Authorization', authKeyReg);
      } catch (err) {
        // was already deleted by core
        if (err.status !== 404) return next(errors.unexpectedError(new Error(`Error while deleting user on register at: ${registerUrl}. Register error: ${err.message}`)));
      }

      auditLogger.appendToLogFile(res.locals.username, DELETE_USER_ACTION, usernameToDelete);
      
      res.status(200).json({username: usernameToDelete});
    }
  );

  expressApp.delete(
    '/platform-users/:username/mfa',
    authorizationService.verifyIsAllowedTo(PLATFORM_USERS_PERMISSIONS.MODIFY),
    async function (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
    ) {
      const authKeyCore = settings.get('internals:CORE_SYSTEM_KEY');
      const username = req.params.username;
      const registerUrl = settings.get('registerUrl');
      let coreUrl: string;
      // find core
      try {
        
        const res = await request
          .get(url.resolve(registerUrl, '/cores'))
          .query({username});
        coreUrl = res.body.core.url;
      } catch (err) {
        return next(errors.unexpectedError(new Error(`Error while fetching user\'s core from register at: ${registerUrl}. Register error: ${err.message}`)));
      }

      // send request
      try {
        await request
          .delete(url.resolve(coreUrl, `/system/users/${username}/mfa`))
          .set('authorization', authKeyCore);
      } catch (err) {
        return next(errors.unexpectedError(new Error(`Error while making delete MFA request to core at: ${coreUrl}. Core error: ${err.message}`)));
      }

      auditLogger.appendToLogFile(res.locals.username, MODIFY_USER_ACTION, username);

      res.status(204).end();
  });
};
