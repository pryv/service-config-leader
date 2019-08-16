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

// GET /conf/:component: get configuration for a given Pryv.io component
router.get('/:component', (req: express$Request, res: express$Response, next: express$NextFunction) => {
  try {
    const component = req.params.component;

    const mainConf = readJsonFile('main.json');
    const templateConf = readJsonFile(`templates/${component}.json`);
    
    generateSecrets(mainConf);

    const finalConf = applySubstitutions(mainConf, templateConf);
   
    res.set('content-type', 'application/json');
    res.end(finalConf);
  } catch (err) {
    next(err);
  }
});

function readJsonFile (pathToFile: string): JSONObject {
  const jsonFile = path.join(dataFolder, pathToFile);
  if (! fs.existsSync(jsonFile)) {
    throw errorsFactory.notFound(`Configuration file not found: ${pathToFile}`);
  }
  return JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
}

function applySubstitutions (substitutions: JSONObject, jsonTemplate: JSONObject): string {
  let substitutedConf = JSON.stringify(jsonTemplate);
  for (let [key, value] of Object.entries(substitutions)) {
    if (typeof value === 'string') {
      substitutedConf = substitutedConf.replace(new RegExp(key, 'g'), value);
    }
  }
  return substitutedConf;
}

function generateSecrets (mainConf: JSONObject): void {
  let changed = false;
  for (const [key, value] of Object.entries(mainConf)) {
    if (value === 'SECRET') {
      mainConf[key] = randomAlphaNumKey(32);
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(path.join(dataFolder, 'main.json'), JSON.stringify(mainConf, null, '\t'));
    }
  }
}

function randomAlphaNumKey(size: number): string {
  return Array(size).fill(0).map(() => Math.random().toString(36).charAt(2)).join('');
}

module.exports = router;
