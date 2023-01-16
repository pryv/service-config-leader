import {
  listConfFiles,
  applySubstitutions,
  isValidJSON,
  isJSONFile
} from '@utils/configuration.utils';
const fs = require('fs');
const request = require('superagent');
const _ = require('lodash');
const logger = require('@utils/logging').getLogger('admin');
const errorsFactory = require('@utils/errorsHandling').factory;
const { SETTINGS_PERMISSIONS } = require('@models/permissions.model');
const verifyToken = require('@middlewares/security/token.verification');
const {
  getAuthorizationService,
  AuthorizationService
} = require('@middlewares/security/authorization.service');
const UsersRepository = require('@repositories/users.repository');
const TokensRepository = require('@repositories/tokens.repository');
const {
  loadPlatformTemplate,
  checkMigrations,
  migrate
} = require('@controller/migration');
module.exports = function (
  expressApp,
  settings,
  platformSettings,
  usersRepository,
  tokensRepository
) {
  const authorizationService = getAuthorizationService(usersRepository);
  expressApp.all('/admin*', verifyToken(tokensRepository));
  // updates current settings and save them to disk
  expressApp.put(
    '/admin/settings',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.UPDATE),
    async (req, res, next) => {
      try {
        await platformSettings.load();
        const previousSettings = platformSettings.get();
        const templatesPath = settings.get('templatesPath');
        const newSettings = { ...previousSettings, ...req.body };
        const list = [];
        listConfFiles(templatesPath, list);
        list.forEach((file) => {
          const templateConf = fs.readFileSync(file, 'utf8');
          const newConf = applySubstitutions(
            templateConf,
            settings,
            newSettings
          );
          if (isJSONFile(file) && !isValidJSON(newConf)) {
            throw errorsFactory.invalidInput('Configuration format invalid');
          }
        });
        await platformSettings.save(
          newSettings,
          `update through PUT /admin/settings by ${res.locals.username}`
        );
        return res.send({
          settings: newSettings
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // returns current settings as json
  expressApp.get(
    '/admin/settings',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.READ),
    async (req, res, next) => {
      try {
        await platformSettings.load();
        const currentSettings = platformSettings.get();
        if (currentSettings == null) {
          return next(new Error('Missing platform settings.'));
        }
        return res.json({
          settings: currentSettings
        });
      } catch (err) {
        return next(err);
      }
    }
  );
  // notifies followers about configuration changes
  expressApp.post(
    '/admin/notify',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.UPDATE),
    async (req, res, next) => {
      const followers = settings.get('followers');
      const { services } = req.body;
      if (followers == null) {
        next(new Error('Missing followers settings.'));
      }
      const successes = [];
      const failures = [];
      const requests = [];
      for (const [auth, follower] of Object.entries(followers)) {
        requests.push(
          (async () => {
            const followerUrl = follower.url;
            try {
              await request
                .post(`${followerUrl}/notify`)
                .set('Authorization', auth)
                .send({ services });
              successes.push(follower);
            } catch (e) {
              logger.error('Error while notifying follower:', e);
              failures.push({ ...follower, error: e });
            }
          })()
        );
      }
      await Promise.allSettled(requests);
      res.json({
        successes,
        failures
      });
    }
  );
  // returns list of available config migrations
  expressApp.get(
    '/admin/migrations',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.READ),
    async (req, res, next) => {
      try {
        await platformSettings.load();
        const platform = platformSettings.get();
        const platformTemplate = await loadPlatformTemplate(settings);
        const migrations = checkMigrations(
          platform,
          platformTemplate
        ).migrations.map((m) => _.pick(m, ['versionsFrom', 'versionTo']));
        res.json({ migrations });
      } catch (err) {
        next(err);
      }
    }
  );
  expressApp.post(
    '/admin/migrations/apply',
    authorizationService.verifyIsAllowedTo(SETTINGS_PERMISSIONS.UPDATE),
    async (req, res, next) => {
      try {
        await platformSettings.load();
        const platform = platformSettings.get();
        const platformTemplate = await loadPlatformTemplate(settings);
        const { migrations, migratedPlatform } = migrate(
          platform,
          platformTemplate
        );
        if (migrations.length > 0)
          await platformSettings.save(
            migratedPlatform,
            `update through POST /admin/migrations/apply by ${res.locals.username}`
          );
        res.json({
          migrations: migrations.map((m) =>
            _.pick(m, ['versionsFrom', 'versionTo'])
          )
        });
      } catch (e) {
        next(e);
      }
    }
  );
};
