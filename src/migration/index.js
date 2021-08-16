// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const fs = require('fs');

const versions: Array<{}> = [
  require('./versions/1.7.0'),
];

/**
 * 
 * @param {*} configFolderPath path to the config folder
 */
const migrateIfNeeded = async (configFolderPath: string): void => {
  const fs.readFileSync(configFolderPath, { encoding: 'utf-8' });
  
}
module.exports.migrateIfNeeded = migrateIfNeeded;