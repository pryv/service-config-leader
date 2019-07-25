// @flow

const router = require('express').Router();
const settings = require('../settings');
const path = require('path');
const dataFolder = path.resolve(__dirname, '../../', settings.get('dataFolder'));

// GET /conf/core: get configuration for a core
router.get('/core', (req: express$Request, res: express$Response, next: express$NextFunction) => {
  try {
    const mainConfPath = path.join(dataFolder, 'main.json');
    const coreConfPath = path.join(dataFolder, 'templates', 'core.json');

    const mainConf = require(mainConfPath);
    const coreConf = require(coreConfPath);
    const domain = mainConf.domain;
    const secrets = mainConf.secrets;

    // Secrets
    // TODO: remove these once we can serve secrets separately (as a subobject)
    coreConf.auth.adminAccessKey = secrets.core.adminAccessKey;
    coreConf.auth.ssoCookieSignSecret = secrets.core.ssoCookieSignSecret;
    coreConf.auth.filesReadTokenSecret = secrets.core.filesReadTokenSecret;
    coreConf.services.register.key = secrets.register.adminAccessKey;
    coreConf.services.email.key = secrets.core.mailKey;

    // TODO: set replaceDomain as a global 'json replacer' in Express app
    // Then use res.json() and remove set('Content-Type', 'application/json')
    // https://expressjs.com/fr/api.html#app.set
    const finalConf = JSON.stringify(coreConf, replaceDomain(domain));
    res.set('content-type', 'application/json');
    res.end(finalConf);
  } catch (err) {
    next(err);
  }
});

function replaceDomain (domain) {
  return (key, value) => {
    if (typeof value === 'string') {
      return value.replace('DOMAIN', domain);
    }
    return value;
  };
}

module.exports = router;
