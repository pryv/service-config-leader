// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const request = require('superagent');
const logger = require('@utils/logging').getLogger('admin');
const { SETTINGS_PERMISSIONS } = require('@models/permissions.model');
const { verifyToken } = require('@middlewares/security/token.verification');
const { getPermissionsVerificator, IPermissionsVerificator } = require('@middlewares/security/authorization.verification');

module.exports = function (expressApp: express$Application, settings: Object, platformSettings: Object,
  usersRepository: IUsersRepository,
  tokensRepository: ITokensRepository) {

  const permissionsVerificator: IPermissionsVerificator = getPermissionsVerificator(usersRepository);

  expressApp.all('/admin*', verifyToken(tokensRepository));

  // PUT /admin/settings: updates current settings and save them to disk
  expressApp.put('/admin/settings', permissionsVerificator.hasPermission(SETTINGS_PERMISSIONS.UPDATE),
    (req: express$Request, res: express$Response, next: express$NextFunction) => {
      const previousSettings = platformSettings.get('vars');
      const newSettings = Object.assign({}, previousSettings, req.body);

      platformSettings.set('vars', newSettings);

      platformSettings.save((err) => {
        if (err) {
          platformSettings.set('vars', previousSettings);
          return next(err);
        }
        res.send(newSettings);
      });
    });

  // GET /admin/settings: returns current settings as json
  expressApp.get('/admin/settings', permissionsVerificator.hasPermission(SETTINGS_PERMISSIONS.READ),
    (req: express$Request, res: express$Response, next: express$NextFunction) => {
      const currentSettings = platformSettings.get('vars');
      if (currentSettings == null) {
        next(new Error('Missing platform settings.'));
      }
      res.json(currentSettings);
    });

  // GET /admin/notify: notifies followers about configuration changes
  expressApp.post('/admin/notify', permissionsVerificator.hasPermission(SETTINGS_PERMISSIONS.UPDATE),
    async (req: express$Request, res: express$Response, next: express$NextFunction) => {
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
          failures[auth] = follower;
        }
      }

      res.json({
        successes: successes,
        failures: failures
      });
    });
};
