// @flow

const path = require('path');
const nconf = require('nconf');

let store;
function nconfSettings() {

  if (store != null) return store;

  store = new nconf.Provider();

  // 1. `process.env`
  // 2. `process.argv`
  //
  store.env().argv();

  // 3. Values in `config.json`
  //
  const configFile = store.get('config') || 'dev-config.json';
  store.file({ file: configFile });

  // 4. Any default values
  //
  store.defaults({
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

  if (process.env.NODE_ENV === 'test') store.set('logs:console:active', false);

  return store;
}

module.exports = nconfSettings;
