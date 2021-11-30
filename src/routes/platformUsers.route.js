// @flow

const url = require('url');
const request = require('superagent');
const bluebird = require('bluebird');
const logger = require('@utils/logging').getLogger('platform-users');
const UsersRepository = require('@repositories/users.repository');
const TokensRepository = require('@repositories/tokens.repository');
const verifyToken = require('@middlewares/security/token.verification');
const {
  getAuthorizationService,
  AuthorizationService,
} = require('@middlewares/security/authorization.service');
const { PLATFORM_USERS_PERMISSIONS } = require('@models/permissions.model');
const { getAuditLogger, DELETE_USER_ACTION, MODIFY_USER_ACTION } = require('@utils/auditLogger');
const errors = require('@utils/errorsHandling').factory;
const { isSingleNode, findCoresUrls } = require('@utils/configuration.utils');

module.exports = function (
  expressApp: express$Application,
  settings: Object,
  platformSettings: Object,
  usersRepository: UsersRepository,
  tokensRepository: TokensRepository,
) {
  const authorizationService: AuthorizationService = getAuthorizationService(
    usersRepository,
  );
  const auditLogger = getAuditLogger(settings.get('logs:audit:filePath'));

  expressApp.all('/platform-users*', verifyToken(tokensRepository));

  expressApp.get(
    '/platform-users/:username',
    authorizationService.verifyIsAllowedTo(PLATFORM_USERS_PERMISSIONS.READ),
    async (req: express$Request, res: express$Response, next: express$NextFunction) => {
      const authKey = settings.get('internals:REGISTER_SYSTEM_KEY_1');
      const registerUrl = settings.get('registerUrl');
      const { username } = req.params;
      try {
        const getResponse = await request
          .get(url.resolve(registerUrl, `/admin/users/${username}`))
          .set('Authorization', authKey);
        return res.status(200).json({ user: getResponse.body });
      } catch (err) {
        if (err.status && err.status === 404) return next(errors.notFound(`user with username: "${username}" not found on register at: ${registerUrl}. Register error: ${err.message}`));
        return next(errors.unexpectedError(new Error(`Error while fetching user on register at: ${registerUrl}. Register error: ${err.message}`)));
      }
    },
  );

  expressApp.delete(
    '/platform-users/:username',
    authorizationService.verifyIsAllowedTo(PLATFORM_USERS_PERMISSIONS.DELETE),
    async (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction,
    ) => {
      await platformSettings.load();
      const accountDeletions: Array<string> = platformSettings.get()?.API_SETTINGS?.settings?.ACCOUNT_DELETION?.value;
      const isDeleteAllowed: boolean = accountDeletions.includes('adminToken');
      if (!isDeleteAllowed) {
        const error: any = new Error('Platform user deletion is disabled. Refer to your platform configuration.');
        error.httpStatus = 403;
        return next(error);
      }
      const usernameToDelete = req.params.username;
      const authKeyCore = settings.get('internals:CORE_SYSTEM_KEY');
      const authKeyReg = settings.get('internals:REGISTER_SYSTEM_KEY_1');
      const registerUrl = settings.get('registerUrl');

      try {
        const deleteFromCoresPromises = [];
        let coreUrls: Array<string> = [];
        if (isSingleNode(settings.get('followers'))) {
          coreUrls.push('http://core:3000');
        } else {
          coreUrls = findCoresUrls(settings.get('followers'));
        }
        for (const coreUrl: string of coreUrls) {
          deleteFromCoresPromises.push(
            request
              .delete(url.resolve(coreUrl, `/users/${usernameToDelete}`))
              .set('Authorization', authKeyCore),
          );
        }

        await bluebird.any(deleteFromCoresPromises);
      } catch (err) {
        let unexpectedError: ?{};
        err.forEach((error) => {
          if (error.status !== 404) {
            unexpectedError = error;
          }
        });
        if (unexpectedError != null) {
          logger.warn('Error while deleting user:', unexpectedError);
          return res.status(unexpectedError.status || 500).json(unexpectedError.response || unexpectedError.message);
        }
        // continue with call to reg
      }

      try {
        await request
          .delete(url.resolve(registerUrl, `/users/${usernameToDelete}?onlyReg=true`))
          .set('Authorization', authKeyReg);
      } catch (err) {
        // was already deleted by core
        if (err.status !== 404) return next(errors.unexpectedError(new Error(`Error while deleting user on register at: ${registerUrl}. Register error: ${err.message}`)));
      }

      auditLogger.appendToLogFile(res.locals.username, DELETE_USER_ACTION, usernameToDelete);

      return res.status(200).json({ username: usernameToDelete });
    },
  );

  expressApp.delete(
    '/platform-users/:username/mfa',
    authorizationService.verifyIsAllowedTo(PLATFORM_USERS_PERMISSIONS.MODIFY),
    async (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction,
    ) => {
      const authKeyCore = settings.get('internals:CORE_SYSTEM_KEY');
      const { username } = req.params;
      const registerUrl = settings.get('registerUrl');
      let coreUrl: string = '';

      if (isSingleNode(settings.get('followers'))) {
        coreUrl = 'http://core:3000';
      } else {
        // find core
        try {
          const res = await request
            .get(url.resolve(registerUrl, '/cores'))
            .query({ username });
          coreUrl = res.body.core.url;
        } catch (err) {
          return next(errors.unexpectedError(new Error(`Error while fetching user's core from register at: ${registerUrl}. Register error: ${err.message}`)));
        }
      }

      // send request
      try {
        await request
          .delete(url.resolve(coreUrl, `/system/users/${username}/mfa`))
          .set('authorization', authKeyCore);
      } catch (err) {
        return next(errors.unexpectedError(new Error(`Error while making delete MFA request to core at: ${coreUrl}. Core error: ${err.message}`)));
      }

      try {
        auditLogger.appendToLogFile(res.locals.username, MODIFY_USER_ACTION, username);
      } catch (err) {
        return next(errors.unexpectedError(new Error(`Error while logging MFA deactivation: ${err.message}`)));
      }

      return res.status(204).end();
    },
  );
};
