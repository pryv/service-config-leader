// @flow

const path = require('path');
const fs = require('fs');
const errorsFactory = require('../utils/errorsHandling').factory;
const middlewares = require('../middlewares');

module.exports = function (expressApp: express$Application, settings: Object, platformSettings: Object) {

  expressApp.all('/conf', middlewares.authorization(settings));

  // GET /conf: serve full configuration for given Pryv.io role
  expressApp.get('/conf', (req: express$Request, res: express$Response, next: express$NextFunction) => {
    try {
      const role = req.context.role;
      const pathToData = settings.get('pathToData');
      const confFolder = path.join(pathToData, role);

      if (! fs.existsSync(confFolder) || ! fs.lstatSync(confFolder).isDirectory()) {
        throw errorsFactory.notFound(`Configuration folder not found for '${role}'.`);
      }

      let list = [];
      listConfFiles(confFolder, list);

      let fullConf = [];
      list.forEach(file => {
        const templateConf = fs.readFileSync(file, 'utf8');
        const fileName = file.replace(confFolder, '');
        fullConf.push({
          path: fileName,
          content: applySubstitutions(templateConf)
        });
      });
    
      res.json({files: fullConf});
    } catch (err) {
      next(err);
    }
  });

  function applySubstitutions (template: string): string {
    const platformVars = platformSettings.get('platform');
    const internalVars = settings.get('internals');

    if (platformVars == null && internalVars == null) return template;

    let substitutions = Object.assign({}, internalVars, platformVars);

    let entries = {};

    function iter(obj) {
      Object.entries(obj).forEach(([key, val]) => {
        if (typeof val === 'object') {
          iter(val);
        }
        if (Array.isArray(val)) {
          val.forEach(sub => {
            iter(sub);
          });
        }
        if (typeof val === 'string') {
          entries[key] = val;
        }
      });
    }
    iter(substitutions);

    const re = new RegExp(Object.keys(entries).join('|'), 'g');
    return template.replace(re, (match) => {
      return entries[match];
    });
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
