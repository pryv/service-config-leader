// @flow

const router = require('express').Router();
const settings = require('../settings');
const path = require('path');
const dataFolder = path.resolve(__dirname, '../../', settings.get('dataFolder'));

// GET /conf/core: get configuration for a core
router.get('/core', (req: express$Request, res: express$Response, next: express$NextFunction) => {
  try {
    const mainConfPath = path.join(dataFolder, 'main.json');
    const coreConfPath = path.join(dataFolder, 'core.json');

    const mainConf = require(mainConfPath);
    const coreConf = require(coreConfPath);
    
    const domain = mainConf.domain;
    const secrets = mainConf.secrets;

    coreConf.auth = Object.assign({}, coreConf.auth, {
      adminAccessKey: secrets.core.adminAccessKey,
      ssoCookieDomain: `.${domain}`,
      ssoCookieSignSecret: secrets.core.ssoCookieSignSecret,
      filesReadTokenSecret: secrets.core.filesReadTokenSecret,
      passwordResetPageURL: `https://sw.${domain}/access/reset-password.html`
    });

    coreConf.auth.trustedApps += `, *@https://*.${domain}*`;

    coreConf.services.register = Object.assign({}, coreConf.services.register, {
      url: `https://reg.${domain}`,
      key: secrets.register.adminAccessKey
    });

    coreConf.services.email = Object.assign({}, coreConf.services.email, {
      url: `https://mail.${domain}/sendmail/`,
      key: secrets.core.mailKey
    });
    
    res.json(coreConf);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
