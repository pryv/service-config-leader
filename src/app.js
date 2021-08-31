// @flow

import type { UserNoPerms } from '@models/user.model';

const _ = require('lodash');
const express = require('express');
const middlewares = require('@middlewares');
const fs = require('fs');
const nconfSettings = (new (require('./settings'))()).store;
const Database = require('better-sqlite3');
const { CronJob } = require('cron');
const UsersRepository = require('@repositories/users.repository');
const TokensRepository = require('@repositories/tokens.repository');
const {
  USERS_PERMISSIONS,
  SETTINGS_PERMISSIONS,
  PLATFORM_USERS_PERMISSIONS,
} = require('@models/permissions.model');
const morgan = require('morgan');
const { setupGit } = require('@controller/migration');
const platformSettings = require('./platform')(nconfSettings);

class Application {
  express: express$Application;

  settings: Object;

  platformSettings: Object;

  logger: Object;

  db: Database;

  usersRepository: UsersRepository;

  tokensRepository: TokensRepository;

  git: {};

  constructor(settingsOverride = {}) {
    this.settings = _.cloneDeep(nconfSettings);
    this.platformSettings = _.cloneDeep(platformSettings);
    if (settingsOverride.nconfSettings) this.settings.merge(settingsOverride.nconfSettings);
    if (settingsOverride.platformSettings) this.platformSettings.merge(settingsOverride.platformSettings);

    this.logger = require('./utils/logging').getLogger('app');
    this.db = this.connectToDb();
    this.usersRepository = new UsersRepository(this.db);
    this.tokensRepository = new TokensRepository(this.db);
    this.express = this.setupExpressApp(this.settings, this.platformSettings);
    this.generateSecrets(this.settings);
    this.generateInitialUser();
    this.startTokensBlacklistCleanupJob();
    this.git = setupGit({
      baseDir: this.settings.get('gitRepoPath'),
    });
  }

  /**
   * mandatory in production and tests requiring git (POST /admin/migrations)
   */
  async init() {
    await this.git.initRepo();
  }

  generateSecrets(settings: Object): void {
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
      return Array(size)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join('');
    }
  }

  connectToDb(): Database {
    return new Database(
      `${this.settings.get('databasePath')}/config-user-management.db`,
    );
  }

  disconnectFromDb() {
    this.db.close();
  }

  setupExpressApp(
    settings: Object,
    platformSettings: Object,
  ): express$Application {
    const expressApp = express();

    expressApp.use(express.json());
    expressApp.use(morgan('combined', { skip: () => process.env.NODE_ENV === 'test' }));
    expressApp.use(middlewares.cors);

    require('./routes/conf.route')(expressApp, settings, platformSettings);
    require('./routes/admin.route')(
      expressApp,
      settings,
      platformSettings,
      this.usersRepository,
      this.tokensRepository,
    );
    require('./routes/users.route')(
      expressApp,
      this.usersRepository,
      this.tokensRepository,
    );
    require('./routes/auth.route')(
      expressApp,
      this.usersRepository,
      this.tokensRepository,
    );
    require('./routes/platformUsers.route')(
      expressApp,
      settings,
      platformSettings,
      this.usersRepository,
      this.tokensRepository,
    );

    expressApp.use(middlewares.errors);

    return expressApp;
  }

  startTokensBlacklistCleanupJob() {
    const job = new CronJob(
      '0 0 * * 0,3,5',
      (() => {
        this.tokensRepository.clean();
      }),
      null,
      false,
    );
    job.start();
  }

  generateInitialUser() {
    const initialUser = {
      username: 'initial_user',
      password: 'temp_pass',
      permissions: {
        users: [
          USERS_PERMISSIONS.READ,
          USERS_PERMISSIONS.CREATE,
          USERS_PERMISSIONS.DELETE,
          USERS_PERMISSIONS.RESET_PASSWORD,
          USERS_PERMISSIONS.CHANGE_PERMISSIONS,
        ],
        settings: [SETTINGS_PERMISSIONS.READ, SETTINGS_PERMISSIONS.UPDATE],
        platformUsers: [
          PLATFORM_USERS_PERMISSIONS.READ,
          PLATFORM_USERS_PERMISSIONS.DELETE,
          PLATFORM_USERS_PERMISSIONS.MODIFY,
        ],
      },
    };

    this.usersRepository.deleteUser(initialUser.username);
    this.usersRepository.createUser(initialUser);
    const createdUser: UserNoPerms = this.usersRepository.resetPassword(
      initialUser.username,
    );
    this.logger.info(
      `Initial user generated. Username: ${initialUser.username}, password: ${createdUser.password}`,
    );
    // also set password in the credentials volume - this directory should be set in docker-compose
    const credentialsFilePath = this.settings.get('credentials:filePath');
    fs.writeFileSync(credentialsFilePath, createdUser.password);
  }
}

module.exports = Application;
