// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const request = require('superagent');
const middlewares = require('@middlewares');
const logger = require('@utils/logging').getLogger('admin');

module.exports = function (expressApp: express$Application, settings: Object, platformSettings: Object) {

  expressApp.all('/admin/*', middlewares.authorizationAdmin(settings));

  // PUT /admin/settings: updates current settings and save them to disk
  expressApp.put('/admin/settings', (req: express$Request, res: express$Response, next: express$NextFunction) => {
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
  expressApp.get('/admin/settings', (req: express$Request, res: express$Response, next: express$NextFunction) => {
    const currentSettings = platformSettings.get('vars');
    if (currentSettings == null) {
      next(new Error('Missing platform settings.'));
    }
    res.json(currentSettings);
  });

  // GET /admin/notify: notifies followers about configuration changes
  expressApp.post('/admin/notify', async (req: express$Request, res: express$Response, next: express$NextFunction) => {
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
      } catch(err) {
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
