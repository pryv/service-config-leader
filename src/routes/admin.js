// @flow

const request = require('superagent');
const middlewares = require('../middlewares');

module.exports = function (expressApp: express$Application, settings: Object) {

  expressApp.all('/admin/*', middlewares.authorizationAdmin(settings));

  // PUT /admin/settings: updates current settings and save them to disk
  expressApp.put('/admin/settings', (req: express$Request, res: express$Response, next: express$NextFunction) => {
    const previousSettings = settings.get('platform');

    settings.set('platform', Object.assign({}, previousSettings, req.body));

    settings.save((err) => {
      if (err) {
        settings.set('platform', previousSettings);
        return next(err);
      }
      res.send('Settings successfully updated.');
    });
  });

  // GET /admin/settings: returns current settings as json
  expressApp.get('/admin/settings', (req: express$Request, res: express$Response, next: express$NextFunction) => {
    const currentSettings = settings.get('platform');
    if (currentSettings == null) {
      next(new Error('Missing platform settings.'));
    }
    res.json(currentSettings);
  });

  // GET /admin/update: triggers an update of the platform
  expressApp.post('/admin/update', async (req: express$Request, res: express$Response, next: express$NextFunction) => {
    const followers = settings.get('followers');
    if (followers == null) {
      next(new Error('Missing followers settings.'));
    }

    let responses = {};
    for (const [auth, follower] of Object.entries(followers)) {
      const followerUrl = follower.url;

      let currentRes = null;
      try {
        const res = await request
          .post(`${followerUrl}/restart`)
          .set('Authorization', auth);
        currentRes = res.text;
      } catch(err) {
        currentRes = err;
      }

      responses[auth] = currentRes;
    }

    res.json(responses);
  });
};
