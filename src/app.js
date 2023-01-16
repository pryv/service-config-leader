/**
 * @license
 * Copyright (C) 2019–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const bluebird = require('bluebird');
const express = require('express');
const middlewares = require('@middlewares');
const fs = require('fs');
const Database = require('better-sqlite3');
const { CronJob } = require('cron');
const UsersRepository = require('@repositories/users.repository');
const TokensRepository = require('@repositories/tokens.repository');
const {
  USERS_PERMISSIONS,
  SETTINGS_PERMISSIONS,
  PLATFORM_USERS_PERMISSIONS
} = require('@models/permissions.model');
const morgan = require('morgan');
const { setupGit } = require('@controller/migration');
const { injectTestSettings, getSettings } = require('./settings');

class Application {
  /**
   * @type {express$Application}
   */
  express;
  settings;
  platformSettings;
  logger;
  /**
   * @type {Database}
   */
  db;
  /**
   * @type {UsersRepository}
  */
  usersRepository;
  /**
   * @type {TokensRepository}
   */
  tokensRepository;
  /**
   * @type {object}
   */
  git;

  /**
   * @param {object} settingsOverride
   */
  constructor (settingsOverride = {}) {
    if (settingsOverride.nconfSettings != null) injectTestSettings(settingsOverride.nconfSettings);
    this.settings = getSettings();
    this.platformSettings = require('./platform')(this.settings);
    if (settingsOverride.platformSettings != null) this.platformSettings.setOverrides(settingsOverride.platformSettings);
    this.logger = require('./utils/logging').getLogger('app');
    this.db = this.connectToDb();
    this.usersRepository = new UsersRepository(this.db);
    this.tokensRepository = new TokensRepository(this.db);
    this.express = this.setupExpressApp();
    this.generateInitialUser();
    this.startTokensBlacklistCleanupJob();
    this.git = setupGit({
      baseDir: this.settings.get('gitRepoPath')
    });
  }

  /**
   * mandatory in production and tests requiring git (POST /admin/migrations/apply)
   * @returns {Promise<void>}
   */
  async init () {
    await this.platformSettings.load();
    await this.generateSecretsIfNeeded();
    await this.git.initRepo();
    // for some reason, in CI, the "git commit" action can't figure out the author
    if (!process.env.IS_CI) await this.git.commitChanges('config leader boot');
  }

  /**
   * @returns {Promise<void>}
   */
  async generateSecretsIfNeeded () {
    const internalSettings = this.settings.get('internals');

    if (internalSettings == null) return;

    let isChanged = false;
    for (const [key, value] of Object.entries(internalSettings)) {
      if (value === 'SECRET') {
        this.settings.set(`internals:${key}`, randomAlphaNumKey(32));
        isChanged = true;
      }
    }

    try {
      if (isChanged) await bluebird.fromCallback((cb) => this.settings.save(cb));
    } catch (err) {
      this.logger.error('Error when saving secrets.', err);
    }

    function randomAlphaNumKey (size) {
      return Array(size)
        .fill(0)
        .map(() => Math.random().toString(36).charAt(2))
        .join('');
    }
  }

  /**
   * @returns {Database}
   */
  connectToDb () {
    return new Database(
      `${this.settings.get('databasePath')}/config-user-management.db`
    );
  }

  /**
   * @returns {void}
   */
  disconnectFromDb () {
    this.db.close();
  }

  /**
   * @returns {express$Application}
   */
  setupExpressApp () {
    const { settings, platformSettings } = this;
    const expressApp = express();

    expressApp.use(express.json());
    expressApp.use(
      morgan('combined', { skip: () => process.env.NODE_ENV === 'test' })
    );
    expressApp.use(middlewares.cors);

    require('./routes/conf.route')(expressApp, settings, platformSettings);
    require('./routes/admin.route')(
      expressApp,
      settings,
      platformSettings,
      this.usersRepository,
      this.tokensRepository
    );
    require('./routes/users.route')(
      expressApp,
      this.usersRepository,
      this.tokensRepository
    );
    require('./routes/auth.route')(
      expressApp,
      this.usersRepository,
      this.tokensRepository
    );
    require('./routes/platformUsers.route')(
      expressApp,
      settings,
      platformSettings,
      this.usersRepository,
      this.tokensRepository
    );

    expressApp.use(middlewares.errors);

    return expressApp;
  }

  /**
   * @returns {void}
   */
  startTokensBlacklistCleanupJob () {
    const job = new CronJob(
      '0 0 * * 0,3,5',
      () => {
        this.tokensRepository.clean();
      },
      null,
      false
    );
    job.start();
  }

  /**
   * @returns {void}
   */
  generateInitialUser () {
    const initialUser = {
      username: 'initial_user',
      password: 'temp_pass',
      permissions: {
        users: [
          USERS_PERMISSIONS.READ,
          USERS_PERMISSIONS.CREATE,
          USERS_PERMISSIONS.DELETE,
          USERS_PERMISSIONS.RESET_PASSWORD,
          USERS_PERMISSIONS.CHANGE_PERMISSIONS
        ],
        settings: [SETTINGS_PERMISSIONS.READ, SETTINGS_PERMISSIONS.UPDATE],
        platformUsers: [
          PLATFORM_USERS_PERMISSIONS.READ,
          PLATFORM_USERS_PERMISSIONS.DELETE,
          PLATFORM_USERS_PERMISSIONS.MODIFY
        ]
      }
    };

    this.usersRepository.deleteUser(initialUser.username);
    this.usersRepository.createUser(initialUser);
    const createdUser = this.usersRepository.resetPassword(
      initialUser.username
    );
    this.logger.info(
      `Initial user generated. Username: ${initialUser.username}, password: ${createdUser.password}`
    );
    // also set password in the credentials volume - this directory should be set in docker-compose
    const credentialsFilePath = this.settings.get('credentials:filePath');
    fs.writeFileSync(credentialsFilePath, createdUser.password);
  }
}
module.exports = Application;
