// @flow

const router = require('express').Router();
const settings = require('../settings');
const path = require('path');
const fs = require('fs');
const dataFolder = path.resolve(__dirname, '../../', settings.get('dataFolder'));

// GET /conf/:component: get configuration for a given Pryv.io component
router.get('/:component', (req: express$Request, res: express$Response, next: express$NextFunction) => {
  try {
    const component = req.params.component;

    const mainConfPath = path.join(dataFolder, 'main.json');
    if (! fs.existsSync(mainConfPath)) {
      return next(new Error('Missing main configuration file: main.json'));
    }
    const mainConf = require(mainConfPath);

    const templateConfPath = path.join(dataFolder, 'templates', `${component}.json`);
    if (! fs.existsSync(templateConfPath)) {
      return next(new Error(`Template configuration is missing for the given component: ${component}.json`));
    }
    const templateConf = require(templateConfPath);

    let finalConf = JSON.stringify(templateConf);
    for (const [key, value] of Object.entries(mainConf)) {
      if (typeof value === 'string') {
        finalConf = finalConf.replace(new RegExp(key, 'g'), value);
      }
    }

    res.set('content-type', 'application/json');
    res.end(finalConf);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
