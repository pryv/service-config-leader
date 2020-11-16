// @flow

const nconf = require('nconf');
const path = require('path');

function nconfSettings() {
  this.store = new nconf.Provider();

  // 1. `process.env`
  // 2. `process.argv`
  //
  this.store.env().argv();

  // 3. Values in `config.json`
  //
  const configFile = this.store.get('config') || 'dev-config.json';
  this.store.file({ file: configFile });

  // 4. Any default values
  //
  this.store.defaults({
    http: {
      port: 7000,
      ip: '127.0.0.1',
    },
    logs: {
      prefix: 'service-configuration',
      console: {
        active: true,
        level: 'info',
        colorize: true,
      },
      file: {
        active: false,
      },
    },
    internals: {
      configLeaderTokenSecret: 'SECRET',
    },
    credentials: {
      filePath: '/app/credentials/credentials.txt',
    },
  });

  return this;
}

module.exports = nconfSettings;
