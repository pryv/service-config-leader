/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const nconf = require('nconf');

let store;

/**
 * @returns {any}
 */
function getSettings () {
  if (store != null) return store;
  store = new nconf.Provider();

  store.use('memory');
  store.use('test', { type: 'literal', store: {} });

  // 1. `process.env`
  // 2. `process.argv`
  //
  store.env({
    separator: '__'
  }).argv();

  // 3. Values in `config.json`
  //
  const configFile = store.get('config') || 'dev-config.json';
  store.file({ file: configFile });

  // 4. Any default values
  //
  store.defaults({
    http: {
      port: 7000,
      ip: '127.0.0.1'
    },
    logs: {
      prefix: 'service-configuration',
      console: {
        active: true,
        level: 'info',
        colorize: true
      },
      file: {
        active: false
      }
    },
    internals: {
      configLeaderTokenSecret: 'SECRET'
    },
    credentials: {
      filePath: '/app/credentials/credentials.txt'
    },
    gitRepoPath: '/app/conf/',
    platformSettings: {
      platformConfig: '/app/conf/platform.yml',
      platformTemplate: '/app/conf/template-platform.yml'
    }
  });

  if (process.env.NODE_ENV === 'test') store.set('logs:console:active', false);

  return store;
}

/**
 * @param {object} testConf
 * @returns {void}
 */
function injectTestSettings (testConf) {
  store.add('test', { type: 'literal', store: testConf });
}

module.exports.getSettings = getSettings;
module.exports.injectTestSettings = injectTestSettings;
