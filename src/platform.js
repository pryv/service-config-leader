// @flow

const nconf = require('nconf');

module.exports = function getPlatformSettings(mainSettings: {}): {} {

  const store = new nconf.Provider();

  // 1. `process.env`
  // 2. `process.argv`
  //
  store.env().argv();
  
  // 3. Values in `platform.json`
  //
  const configFile = mainSettings.get('platformSettings:platformConfig') || 'platform.yml';
  console.log('platform conf file', configFile)
  store.file({
    file: configFile,
    format: require('nconf-yaml'),
  });
  
  // 4. Any default values
  //
  store.defaults({
    vars: {},
  });
  return store;
};
