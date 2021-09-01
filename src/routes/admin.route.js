// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const bluebird = require('bluebird');
const fs = require('fs');
const request = require('superagent');
const _ = require('lodash');
const logger = require('@utils/logging').getLogger('admin');
const errorsFactory = require('@utils/errorsHandling').factory;
const { SETTINGS_PERMISSIONS } = require('@models/permissions.model');
const { verifyToken } = require('@middlewares/security/token.verification');
const {
  getAuthorizationService,
  AuthorizationService,
} = require('@middlewares/security/authorization.service');
const { UsersRepository } = require('@repositories/users.repository');
const { TokensRepository } = require('@repositories/tokens.repository');
const { getGit } = require('@controller/migration/git');
import {
  listConfFiles,
  applySubstitutions,
  isValidJSON,
  isJSONFile
} from '@utils/configuration.utils';
const { loadPlatformTemplate, loadPlatform, writePlatform, checkMigrations, migrate } = require('@controller/migration');

module.exports = function (
  expressApp: express$Application,
  settings: Object,
  platformSettings: Object,
  usersRepository: UsersRepository,
  tokensRepository: TokensRepository
) {
  const authorizationService: AuthorizationService = getAuthorizationService(
    usersRepository
  );

  expressApp.all('/admin*', verifyToken(tokensRepository));

  // updates current settings and save them to disk
  expressApp.put(
    '/admin/settings',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.UPDATE),
    async (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
    ) => {
      const previousSettings = platformSettings.get('vars');
      const templatesPath = settings.get('templatesPath');
      const newSettings = Object.assign({}, previousSettings, req.body);

      let list = [];
      listConfFiles(templatesPath, list);

      try {
        list.forEach((file) => {
          const templateConf = fs.readFileSync(file, 'utf8');
          const newConf = applySubstitutions(
            templateConf,
            settings,
            newSettings
          );
          if (isJSONFile(file) && !isValidJSON(newConf)) {
            throw errorsFactory.invalidInput(
              'Configuration format invalid'
            );
          }
        });
      } catch (err) {
        return next(err);
      }
      

      platformSettings.set('vars', newSettings);

      try {
        await bluebird.fromCallback(cb => platformSettings.save(cb));
      } catch (err) {
        platformSettings.set('vars', previousSettings);
        return next(err);
      }

      try {
        // perform git commit
        const git: {} = getGit();
        await git.commitChanges(`update through PUT /admin/settings by ${res.locals.username}`);
      } catch (err) {
        return next(err);
      }
      
      res.send({ 
        settings: newSettings
      });
    }
  );

  // returns current settings as json
  expressApp.get(
    '/admin/settings',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.READ),
    (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
    ) => {
      const currentSettings = platformSettings.get('vars');
      if (currentSettings == null) {
        next(new Error('Missing platform settings.'));
      }
      res.json({
        settings: currentSettings
      });
    }
  );

  // notifies followers about configuration changes
  expressApp.post(
    '/admin/notify',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.UPDATE),
    async (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
    ) => {
      const followers = settings.get('followers');
      const services = req.body.services;
      if (followers == null) {
        next(new Error('Missing followers settings.'));
      }

      let successes = [];
      let failures = [];
      for (const [auth, follower] of Object.entries(followers)) {
        const followerUrl = follower.url;
        try {
          await request
            .post(`${followerUrl}/notify`)
            .set('Authorization', auth)
            .send({ services: services });
          successes.push(follower);
        } catch (err) {
          logger.warn('Error while notifying follower:', err);
          failures.push(Object.assign({}, follower, { error: err }));
        }
      }

      res.json({
        successes: successes,
        failures: failures
      });
    });

  // returns list of available config migrations
  expressApp.get(
    '/admin/migrations',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.READ),
    async (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
    ) => {
      try {
        const platform = await loadPlatform(settings);
        const platformTemplate = await loadPlatformTemplate(settings);
        const migrations = checkMigrations(platform, platformTemplate).migrations.map(m => _.pick(m, ['versionsFrom', 'versionTo']));
        res.json({ migrations });
      } catch (err) {
        next (err);
      }
    }
  );

  expressApp.post(
    '/admin/migrations',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.UPDATE),
    async (
      req: express$Request,
      res: express$Response,
      next: express$NextFunction
    ) => {
      try {
        const platform = await loadPlatform(settings);
        const platformTemplate = await loadPlatformTemplate(settings);
        const { migrations, migratedPlatform } = migrate(platform, platformTemplate);
        if (migrations.length > 0) await writePlatform(settings, migratedPlatform, res.locals.username);
        res.json({ migrations: migrations.map(m => _.pick(m, ['versionsFrom', 'versionTo'])) });
      } catch (e) {
        next(e);
      }
    }
  );
};
