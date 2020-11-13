// @flow

const nconf = require('nconf');
const path = require('path');

function getConfig() {
  console.log('AAAAAAAA runnin getConfig', store);
  const store = new nconf.Provider();

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

  return store;
}

module.exports.getConfig = getConfig;
