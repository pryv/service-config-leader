// @flow

const express = require('express');
const middlewares = require('./middlewares');
const nconfSettings = require('./settings');

opaque type NconfSettings = Object; 

class Application {
  express: express$Application;
  settings: NconfSettings;

  constructor() {
    this.settings = nconfSettings;
    this.express = this.setupExpressApp(this.settings);
    this.generateSecrets(this.settings);
  }

  generateSecrets (settings: NconfSettings): void {
    const secrets = settings.get('platform:secrets');
 
    if (secrets == null) return;

    for (const [key, value] of Object.entries(secrets)) {
      if (value === 'SECRET') {
        settings.set(`platform:secrets:${key}`, randomAlphaNumKey(32));
      }
    }

    function randomAlphaNumKey(size: number): string {
      return Array(size).fill(0).map(
        () => Math.random().toString(36).charAt(2)
      ).join('');
    }
  }

  setupExpressApp(settings: NconfSettings): express$Application {
    const expressApp = express();

    require('./routes/conf')(expressApp, settings);
    require('./routes/machine')(expressApp, settings);

    expressApp.use(middlewares.errors);
    
    return expressApp;
  }
}

module.exports = Application;
