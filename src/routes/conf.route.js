/**
 * @license
 * Copyright (C) 2019–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const { listConfFiles, applySubstitutions, isValidJSON, isJSONFile } = require('@utils/configuration.utils');

const path = require('path');
const fs = require('fs');
const errorsFactory = require('@utils/errorsHandling').factory;
const middlewares = require('@middlewares');
const logger = require('@utils/logging').getLogger('conf');

module.exports = function (expressApp, settings, platformSettings) {
  expressApp.all('/conf', middlewares.authorization(settings));

  // GET /conf: serve full configuration for given Pryv.io role
  expressApp.get(
    '/conf',
    async (req, res, next) => {
      try {
        const { role } = req.context;
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

        const list = [];
        listConfFiles(confFolder, list);
        const fullConf = [];
        let latestModifiedTime = 0;
        let latestModifiedFile = '';
        await platformSettings.load();

        list.forEach((file) => {
          const templateConf = fs.readFileSync(file, 'utf8');
          const fileName = file.replace(confFolder, '');
          const newConf = applySubstitutions(
            templateConf,
            settings,
            platformSettings.get()
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
            content: newConf
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
        logger.error(err);
        next(err);
      }
    }
  );
};
