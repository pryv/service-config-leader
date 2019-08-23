// @flow

module.exports = function (expressApp: express$Application, settings: Object) {

  // PUT /settings: updates current settings and save them to disk
  expressApp.put('/settings', (req: express$Request, res: express$Response, next: express$NextFunction) => {
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

  // GET /settings: returns current settings as json
  expressApp.get('/settings', (req: express$Request, res: express$Response, next: express$NextFunction) => {
    const currentSettings = settings.get('platform');
    if (currentSettings == null) {
      next('Missing platform settings.');
    }
    res.json(currentSettings);
  });
};
