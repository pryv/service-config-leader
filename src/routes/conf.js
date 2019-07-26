// @flow

const router = require('express').Router();
const settings = require('../settings');
const path = require('path');
const fs = require('fs');
const dataFolder = path.resolve(__dirname, '../../', settings.get('dataFolder'));
const errorsFactory = require('../utils/errorsHandling').factory;

// GET /conf/:component: get configuration for a given Pryv.io component
router.get('/:component', (req: express$Request, res: express$Response, next: express$NextFunction) => {
  try {
    const component = req.params.component;

    const mainConf = readJsonFile('main.json');
    const templateConf = readJsonFile(`templates/${component}.json`);

    const finalConf = applySubstitutions(mainConf, templateConf);
   
    res.set('content-type', 'application/json');
    res.end(finalConf);
  } catch (err) {
    next(err);
  }
});

function readJsonFile (pathToFile) {
  const jsonFile = path.join(dataFolder, pathToFile);
  if (! fs.existsSync(jsonFile)) {
    throw errorsFactory.notFound(`Configuration file not found: ${pathToFile}`);
  }
  return JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
}

function applySubstitutions (substitutionsFile, jsonTemplate) {
  let substitutedConf = JSON.stringify(jsonTemplate);
  for (const [key, value] of Object.entries(substitutionsFile)) {
    if (typeof value === 'string') {
      substitutedConf = substitutedConf.replace(new RegExp(key, 'g'), value);
    }
  }
  return substitutedConf;
}

module.exports = router;
