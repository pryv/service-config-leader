// @flow

const path = require('path');
const fs = require('fs');
const errorsFactory = require('@utils/errorsHandling').factory;
const middlewares = require('@middlewares');
const logger = require('@utils/logging').getLogger('conf');
import {
  listConfFiles,
  applySubstitutions,
  isValidJSON,
  isJSONFile
} from '@utils/configuration.utils';

module.exports = function (
  expressApp: express$Application,
  settings: Object,
  platformSettings: Object
) {
  expressApp.all('/conf', middlewares.authorization(settings));

  // GET /conf: serve full configuration for given Pryv.io role
  expressApp.get(
    '/conf',
    (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
    ) => {
      try {
        const role = req.context.role;
        logger.info(`Received request from ${role}.`);
        const templatesPath = settings.get('templatesPath');
        const confFolder = path.join(templatesPath, role);

        if (
          !fs.existsSync(confFolder) ||
          !fs.lstatSync(confFolder).isDirectory()
        ) {
          throw errorsFactory.notFound(
            `Configuration folder not found for '${role}'.`
          );
        }

        let list = [];
        listConfFiles(confFolder, list);
        let fullConf = [];
        let latestModifiedTime = 0;
        let latestModifiedFile = '';
        platformSettings.load();
        list.forEach((file) => {
          const templateConf = fs.readFileSync(file, 'utf8');
          const fileName = file.replace(confFolder, '');
          const newConf = applySubstitutions(
            templateConf,
            settings,
            platformSettings.get('vars')
          );
          if (isJSONFile(file) && !isValidJSON(newConf)) {
            throw errorsFactory.unexpectedError(
              new Error(
                `Configuration file: ${fileName} has invalid format after filling it with platform properties`
              )
            );
          }
          fullConf.push({
            path: fileName,
            content: newConf,
          });
          const stats = fs.statSync(file);
          const modifiedTime = stats.mtimeMs;
          if (modifiedTime > latestModifiedTime) {
            latestModifiedTime = modifiedTime;
            latestModifiedFile = fileName;
          }
        });
        logger.info(
          `Sent configuration files. Latest modification on "${latestModifiedFile}" at ${new Date(
            latestModifiedTime
          )}`
        );
        res.json({ files: fullConf });
      } catch (err) {
        console.error(err);
        next(err);
      }
    }
  );
};
