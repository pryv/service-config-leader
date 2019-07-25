// @flow

const router = require('express').Router();
const settings = require('../settings');
const path = require('path');
const dataFolder = path.resolve(__dirname, '../../', settings.get('dataFolder'));
const PRYVIO_COMPONENTS = ['core', 'register'];

// GET /conf/:component: get configuration for a given Pryv.io component
router.get('/:component', (req: express$Request, res: express$Response, next: express$NextFunction) => {
  try {
    const component = req.params.component;
    if (! PRYVIO_COMPONENTS.includes(component)) {
      return next(new Error(`Invalid Pryv.io component: ${component}. Here is a list of available components: ${PRYVIO_COMPONENTS.join(',')}.`));
    }
    const mainConfPath = path.join(dataFolder, 'main.json');
    const templateConfPath = path.join(dataFolder, 'templates', `${component}.json`);

    const mainConf = require(mainConfPath);
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
