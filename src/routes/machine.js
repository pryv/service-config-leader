// @flow

const router = require('express').Router();
const settings = require('../settings');
const path = require('path');
const fs = require('fs');
const dataFolder = path.resolve(__dirname, '../../', settings.get('dataFolder'));
const errorsFactory = require('../utils/errorsHandling').factory;

// GET /machine/:machineId: list necessary configuration files for given Pryv.io machine
router.get('/:machineId', (req: express$Request, res: express$Response, next: express$NextFunction) => {
  try {
    const machineId = req.params.machineId;
    const machineFolder = path.join(dataFolder, machineId);

    if (! fs.existsSync(machineFolder)) {
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
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      listConfFiles(fullPath, files);
    } else {
      files.push(fullPath.replace(dataFolder, ''));
    }  
  });
}

module.exports = router;
