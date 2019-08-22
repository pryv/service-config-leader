// @flow

const path = require('path');
const fs = require('fs');
const errorsFactory = require('../utils/errorsHandling').factory;

module.exports = function (expressApp: express$Application, settings: Object) {

  // GET /machine: list necessary configuration files for requesting Pryv.io machine
  expressApp.get('/machine', (req: express$Request, res: express$Response, next: express$NextFunction) => {
    try {
      const machineId = req.context.role;
      const pathToData = settings.get('pathToData');
      const machineFolder = path.join(pathToData, machineId);

      if (! fs.existsSync(machineFolder) || !fs.lstatSync(machineFolder).isDirectory()) {
        throw errorsFactory.notFound(`Configuration folder not found for machine '${machineId}'.`);
      }

      let list = [];
      listConfFiles(machineFolder, list);

      res.json(list);
    } catch (err) {
      next(err);
    }
  });

  function listConfFiles(dir: string, files: Array<string>): void {
    const pathToData = settings.get('pathToData');
    fs.readdirSync(dir).forEach(file => {
      let fullPath = path.join(dir, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        listConfFiles(fullPath, files);
      } else {
        files.push(fullPath.replace(pathToData, ''));
      }  
    });
  }
};
