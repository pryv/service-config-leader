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
    this.express = this.setupExpressApp();
  }

  setupExpressApp(): express$Application {
    const expressApp = express();

    require('./routes/conf')(expressApp, this.settings);
    require('./routes/machine')(expressApp, this.settings);

    expressApp.use(middlewares.errors);
    
    return expressApp;
  }
}

module.exports = Application;
