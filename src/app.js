// @flow

const express = require('express');
const middlewares = require('./middlewares');
const nconfSettings = require('./settings.js');
const platformSettings = require('./platform.js');
const Database = require('better-sqlite3');

class Application {
  express: express$Application;
  settings: Object;
  platformSettings: Object;
  logger: Object;
  db: Database;

  constructor() {
    this.logger = require('./utils/logging').getLogger('app');
    this.settings = nconfSettings;
    this.platformSettings = platformSettings;
    this.express = this.setupExpressApp(this.settings, this.platformSettings);
    this.generateSecrets(this.settings);
    this.db = this.connectToDb();
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
    return new Database('config-user-management');
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

    expressApp.use(middlewares.errors);
    
    return expressApp;
  }
}

module.exports = Application;
