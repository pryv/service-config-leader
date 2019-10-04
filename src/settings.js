// @flow

const nconf = require('nconf');
const path = require('path');

// 1. `process.env`
// 2. `process.argv`
//
nconf.env().argv();

// 3. Values in `config.json`
//
const configFile = nconf.get('config') || 'dev-config.json';
nconf.file({ file: configFile});

// 4. Any default values
//
nconf.defaults({
  http: {
    port: 7000,
    ip: '127.0.0.1',
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
    },
    dataFolder: '/app/data',
  },
  platform: {},
  internals: {},
});

nconf.set('pathToData', path.resolve(__dirname, '../', nconf.get('dataFolder')));

module.exports = nconf;
