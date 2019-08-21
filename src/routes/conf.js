// @flow

const path = require('path');
const fs = require('fs');
const errorsFactory = require('../utils/errorsHandling').factory;

module.exports = function (expressApp: express$Application, settings: Application) {

  const pathToData = settings.get('pathToData');
  const platformSettings = settings.get('platform');

  // GET /conf/*: get given configuration file
  expressApp.get('/conf/*', (req: express$Request, res: express$Response, next: express$NextFunction) => {
    try {
      const file = req.params[0];
      const templateConf = readConfFile(file);

      const finalConf = applySubstitutions(platformSettings, templateConf);
    
      res.end(finalConf);
    } catch (err) {
      next(err);
    }
  });

  function readConfFile (pathToFile: string): string {
    const file = path.join(pathToData, pathToFile);
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
};
