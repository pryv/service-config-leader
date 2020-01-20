// @flow

const nconf = require('nconf');
const store = new nconf.Provider();

// 1. `process.env`
// 2. `process.argv`
//
store.env().argv();

// 3. Values in `platform.json`
//
const configFile = store.get('vars') || 'platform.json';
store.file({ file: configFile});

// 4. Any default values
//
store.defaults({
  platform: {},
});

module.exports = store;
