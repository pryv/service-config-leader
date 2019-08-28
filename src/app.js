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
    const platformSettings = settings.get('platform');
 
    if (platformSettings == null) return;

    for (const [key, value] of Object.entries(platformSettings)) {
      if (value === 'SECRET') {
        settings.set(`platform:${key}`, randomAlphaNumKey(32));
      }
    }

    settings.save((err) => {
      if (err) {
        console.log('Error when saving secrets.');
      }
    });

    function randomAlphaNumKey(size: number): string {
      return Array(size).fill(0).map(
        () => Math.random().toString(36).charAt(2)
      ).join('');
    }
  }

  setupExpressApp(settings: NconfSettings): express$Application {
    const expressApp = express();

    expressApp.use(express.json());
    expressApp.use(middlewares.authorization(settings));

    require('./routes/conf')(expressApp, settings);
    require('./routes/admin')(expressApp, settings);

    expressApp.use(middlewares.errors);
    
    return expressApp;
  }
}

module.exports = Application;
