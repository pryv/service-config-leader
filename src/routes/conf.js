// @flow

const path = require('path');
const fs = require('fs');
const errorsFactory = require('../utils/errorsHandling').factory;

module.exports = function (expressApp: express$Application, settings: Object) {

  type SubstitutionMap = {
    [key: string]: string
  };

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

      const platformSettings = settings.get('platform');
      let fullConf = [];
      list.forEach(file => {
        const templateConf = fs.readFileSync(file, 'utf8');
        const fileName = file.replace(confFolder, '');
        fullConf.push({
          path: fileName,
          content: applySubstitutions(platformSettings, templateConf)
        });
      });
    
      res.json({files: fullConf});
    } catch (err) {
      next(err);
    }
  });

  function applySubstitutions (substitutions: SubstitutionMap, template: string): string {
    if (substitutions == null) return template;

    const substitutionKeys = Object.keys(substitutions).filter(key => {
      return typeof substitutions[key] === 'string';
    });
    const re = new RegExp(substitutionKeys.join('|'), 'g');
    return template.replace(re, (match) => {
      return substitutions[match];
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
