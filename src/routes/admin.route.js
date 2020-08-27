// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const fs = require('fs');
const request = require('superagent');
const logger = require('@utils/logging').getLogger('admin');
const errorsFactory = require('@utils/errorsHandling').factory;
const { SETTINGS_PERMISSIONS } = require('@models/permissions.model');
const { verifyToken } = require('@middlewares/security/token.verification');
const {
  getAuthorizationService,
  AuthorizationService,
} = require('@middlewares/security/authorization.service');
const { UsersRepository } = require('@repositories/users.repository');
const { TokensRepository } = require('@repositories/tokens.repository');
import {
  listConfFiles,
  applySubstitutions,
  isValidJSON,
} from '@utils/configuration.utils';

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

  expressApp.all('/admin*', verifyToken(tokensRepository));

  // PUT /admin/settings: updates current settings and save them to disk
  expressApp.put(
    '/admin/settings',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.UPDATE),
    (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
    ) => {
      const previousSettings = platformSettings.get('vars');
      const templatesPath = settings.get('templatesPath');
      const newSettings = Object.assign({}, previousSettings, req.body);

      let list = [];
      listConfFiles(templatesPath, list);

      list.forEach((file) => {
        const templateConf = fs.readFileSync(file, 'utf8');
        const newConf = applySubstitutions(
          templateConf,
          settings,
          newSettings
        );
        if (file.split('/').pop().split('.').pop() === 'json' && !isValidJSON(newConf)) {
          throw errorsFactory.invalidInput(
            'Configuration format invalid'
          );
        }
      });

      platformSettings.set('vars', newSettings);

      platformSettings.save((err) => {
        if (err) {
          platformSettings.set('vars', previousSettings);
          return next(err);
        }
        res.send(newSettings);
      });
    }
  );

  // GET /admin/settings: returns current settings as json
  expressApp.get(
    '/admin/settings',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.READ),
    (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
    ) => {
      const currentSettings = platformSettings.get('vars');
      if (currentSettings == null) {
        next(new Error('Missing platform settings.'));
      }
      res.json(currentSettings);
    }
  );

  // GET /admin/notify: notifies followers about configuration changes
  expressApp.post(
    '/admin/notify',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.UPDATE),
    async (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
    ) => {
      const followers = settings.get('followers');
      if (followers == null) {
        next(new Error('Missing followers settings.'));
      }

      let successes = {};
      let failures = {};
      for (const [auth, follower] of Object.entries(followers)) {
        const followerUrl = follower.url;
        try {
          await request
            .post(`${followerUrl}/notify`)
            .set('Authorization', auth);
          successes[auth] = follower;
        } catch (err) {
          logger.warn('Error while notifying follower:', err);
          failures[auth] = Object.assign({}, follower, { error: err });
        }
      }

      res.json({
        successes: successes,
        failures: failures,
      });
    }
  );
};
