// @flow

const nconf = require('nconf');
const store = new nconf.Provider();

// 1. `process.env`
// 2. `process.argv`
//
store.env().argv();

// 3. Values in `platform.json`
//
const configFile = store.get('platformConfig') || 'platform.yml';
store.file({
  file: configFile,
  format: require('nconf-yaml'),
});

// 4. Any default values
//
store.defaults({
  vars: {},
});

module.exports = store;
