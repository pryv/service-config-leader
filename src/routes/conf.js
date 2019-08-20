// @flow

const router = require('express').Router();
const settings = require('../settings');
const path = require('path');
const fs = require('fs');
const dataFolder = path.resolve(__dirname, '../../', settings.get('dataFolder'));
const errorsFactory = require('../utils/errorsHandling').factory;

type JSONObject = {
  [key: string]: any
};

// GET /conf/*: get given configuration file
router.get('/*', (req: express$Request, res: express$Response, next: express$NextFunction) => {
  try {
    const file = req.params[0];
    const mainConf = JSON.parse(readConfFile('main.json'));
    const templateConf = readConfFile(file);

    const finalConf = applySubstitutions(mainConf, templateConf);
   
    res.end(finalConf);
  } catch (err) {
    next(err);
  }
});

function readConfFile (pathToFile: string): string {
  const file = path.join(dataFolder, pathToFile);
  if (! fs.existsSync(file) || ! fs.lstatSync(file).isFile()) {
    throw errorsFactory.notFound(`Configuration file not found: ${pathToFile}`);
  }
  return fs.readFileSync(file, 'utf8');
}

function applySubstitutions (substitutions: JSONObject, template: string): string {
  let substitutedConf = template;
  for (const [key, value] of Object.entries(substitutions)) {
    if (typeof value === 'string') {
      substitutedConf = substitutedConf.replace(new RegExp(key, 'g'), value);
    }
  }
  return substitutedConf;
}

module.exports = router;
