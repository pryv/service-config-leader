// @flow

const express = require('express');
const middlewares = require('@middlewares');
const nconfSettings = require('./settings.js');
const platformSettings = require('./platform.js');
const Database = require('better-sqlite3');
const { randomBytes } = require('crypto');
const CronJob = require('cron').CronJob;
const { UsersRepository, IUsersRepository } = require('@repositories/users.repository');
const { TokensRepository, ITokensRepository } = require('@repositories/tokens.repository');
const { USERS_PERMISSIONS } = require('@models/permissions.model');

class Application {
  express: express$Application;
  settings: Object;
  platformSettings: Object;
  logger: Object;
  db: Database;
  usersRepository: IUsersRepository;
  tokensRepository: ITokensRepository;

  constructor() {
    process.env.SECRET = randomBytes(32).toString();

    this.logger = require('./utils/logging').getLogger('app');
    this.settings = nconfSettings;
    this.platformSettings = platformSettings;
    this.db = this.connectToDb();
    this.usersRepository = new UsersRepository(this.db);
    this.tokensRepository = new TokensRepository(this.db);
    this.express = this.setupExpressApp(this.settings, this.platformSettings);
    this.generateSecrets(this.settings);
    this.generateInitialUser();
    this.startTokensBlacklistCleanupJob();
  }

  generateSecrets (settings: Object): void {
    const internalSettings = settings.get('internals');
 
    if (internalSettings == null) return;

    for (const [key, value] of Object.entries(internalSettings)) {
      if (value === 'SECRET') {
        settings.set(`internals:${key}`, randomAlphaNumKey(32));
      }
    }

    settings.save((err) => {
      if (err) {
        this.logger.error('Error when saving secrets.', err);
      }
    });

    function randomAlphaNumKey(size: number): string {
      return Array(size).fill(0).map(
        () => Math.random().toString(36).charAt(2)
      ).join('');
    }
  }

  connectToDb(): Database {
    return new Database('config-user-management.db');
  }

  disconnectFromDb() {
    this.db.close();
  }

  setupExpressApp(settings: Object, platformSettings: Object): express$Application {
    const expressApp = express();

    expressApp.use(express.json());
    expressApp.use(middlewares.cors);

    require('./routes/conf.route')(expressApp, settings, platformSettings);
    require('./routes/admin.route')(expressApp, settings, platformSettings);
    require('./routes/users.route')(expressApp, this.usersRepository, this.tokensRepository, 
      this.allowedSettingsPermissionsKeys(platformSettings));
    require('./routes/auth.route')(expressApp, this.usersRepository, this.tokensRepository);

    expressApp.use(middlewares.errors);
    
    return expressApp;
  }
  
  startTokensBlacklistCleanupJob() {
    const job = new CronJob('0 0 * * 0,3,5', function() {
      this.tokensRepository.clean();
    }, null, false);
    job.start();
  }

  allowedSettingsPermissionsKeys(platformSettings: Object) {
    return Object.keys(platformSettings.get('vars'));
  }

  generateInitialUser() {
    const initialUser = {
      username: 'main_user',
      password: 'temp_pass',
      permissions: {
        users: [
          USERS_PERMISSIONS.READ, 
          USERS_PERMISSIONS.CREATE, 
          USERS_PERMISSIONS.DELETE, 
          USERS_PERMISSIONS.RESET_PASSWORD, 
          USERS_PERMISSIONS.CHANGE_PERMISSIONS
        ]
      }
    };

    this.usersRepository.deleteUser(initialUser.username);
    this.usersRepository.createUser(initialUser);
    const createdUser = this.usersRepository.resetPassword(initialUser.username);
    console.info(`Initial user generated. Username: ${initialUser.username}, password: ${createdUser.password}`);
  }
}

module.exports = Application;
