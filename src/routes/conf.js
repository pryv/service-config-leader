// @flow

const path = require('path');
const fs = require('fs');
const errorsFactory = require('../utils/errorsHandling').factory;
const middlewares = require('../middlewares');

module.exports = function (expressApp: express$Application, settings: Object, platformSettings: Object) {

  const logger = require('../utils/logging').getLogger('conf');

  expressApp.all('/conf', middlewares.authorization(settings));

  // GET /conf: serve full configuration for given Pryv.io role
  expressApp.get('/conf', (req: express$Request, res: express$Response, next: express$NextFunction) => {
    try {
      const role = req.context.role;
      logger.info(`Received request from ${role}.`);
      const pathToData = settings.get('pathToData');
      const confFolder = path.join(pathToData, role);

      if (! fs.existsSync(confFolder) || ! fs.lstatSync(confFolder).isDirectory()) {
        throw errorsFactory.notFound(`Configuration folder not found for '${role}'.`);
      }

      let list = [];
      listConfFiles(confFolder, list);

      let fullConf = [];
      let latestModifiedTime = 0;
      let latestModifiedFile = '';
      list.forEach(file => {
        const templateConf = fs.readFileSync(file, 'utf8');
        const fileName = file.replace(confFolder, '');
        fullConf.push({
          path: fileName,
          content: applySubstitutions(templateConf)
        });
        const stats = fs.statSync(file);
        const modifiedTime = stats.mtimeMs;
        if (modifiedTime > latestModifiedTime) {
          latestModifiedTime = modifiedTime;
          latestModifiedFile = fileName;
        }
      });
      logger.info(`Sent configuration files. Latest modification on "${latestModifiedFile}" at ${new Date(latestModifiedTime)}`);
      res.json({files: fullConf});
    } catch (err) {
      next(err);
    }
  });

  function applySubstitutions (template: string): string {
    const platformVars = platformSettings.get('vars');
    const internalVars = settings.get('internals');

    if (platformVars == null && internalVars == null) return template;

    let substitutions = Object.assign({}, internalVars, platformVars);

    const re = new RegExp(Object.keys(substitutions).join('|'), 'g');
    return replaceInString(template);

    function replaceInString(myString: string): string {
      return myString.replace(re, (match) => {
        const replacement = substitutions[match];
        if (typeof replacement !== 'string') {
          return replaceInString(JSON.stringify(replacement));
        }
        return replaceInString(replacement);
      })
    }
  }

  function listConfFiles(dir: string, files: Array<string>): void {
    fs.readdirSync(dir).forEach(file => {
      let fullPath = path.join(dir, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        listConfFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    });
  }
};
