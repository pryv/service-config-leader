// @flow

const nconf = require('nconf');
const store = new nconf.Provider();

// 1. Values in `platform.json`
//
store.file({ file: 'platform.json'});


// 2. Any default values
//
store.defaults({
  platform: {},
});

module.exports = store;
