// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const yaml = require('js-yaml');
const fs = require('fs');
const compareVersions = require('compare-versions');

type Migration = {
  versionFrom: string,
  versionTo: string,
  function: ({}) => {},
}

const migrations: Array<Migration> = [
  { versionFrom: '1.6.21', versionTo: '1.6.22', function: require('./versions/1.6.22') },
  { versionFrom: '1.6.22', versionTo: '1.6.23', function: require('./versions/1.6.23') },
  { versionFrom: '1.6.23', versionTo: '1.7.0', function: require('./versions/1.7.0') },
];

/**
 * 
 * @param {*} configFolderPath path to the config folder
 */
const migrate = (platform: {}, template: {}): {} => {
  const migrations: Array<Migration> = checkMigrations(platform, template);
  
}
module.exports.migrate = migrate;

const loadPlatformTemplate = (settings: {}): {} => {
  const platformTemplate: string = settings.get('platformSettings:platformTemplate');
  if (platformTemplate == null) throw new Error('platformSettings:platformTemplate not set in config-leader.json. Config migrations will not work.');
  try {
    return yaml.load(fs.readFileSync(platformTemplate, { encoding: 'utf-8' }));
  } catch (e) {
    throw new Error(`Error while reading and parsing template platform file at ${platformTemplate}. ${e}`);
  }
}
module.exports.loadPlatformTemplate = loadPlatformTemplate;

/**
 * Returns the list of migrations to apply
 * 
 * @param {*} platform the platform.yml content
 * @param {*} template the template-platform.yml content
 */
const checkMigrations = (platform: {}, template: {}): Array<Migration> => {
  validate(platform);
  validate(template);

  const platformVersion: string = platform.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value;
  const templateVersion: string = template.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value;
  if (platformVersion === templateVersion) return [];

  return computeNeededMigrations(platformVersion, templateVersion).map(m => { return { versionFrom: m.versionFrom, versionTo: m.versionTo };});

  function validate(conf: {}): void {
    if (
      conf.vars ==  null || 
      conf.vars.MISCELLANEOUS_SETTINGS ==  null || 
      conf.vars.MISCELLANEOUS_SETTINGS.settings ==  null || 
      conf.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION ==  null || 
      conf.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value == null
    ) throw new Error('template version missing. "vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value" undefined.');
  }
}
module.exports.checkMigrations = checkMigrations;

/**
 * Returns an array of version migrations
 * 
 * @param {*} platformVersion 
 * @param {*} templateVersion 
 */
function computeNeededMigrations(platformVersion: string, templateVersion: string): Array<Migration> {
  const cv: number = compareVersions(platformVersion, templateVersion);
  
  const versions: Array<Migration> = [];
  if (cv === 1 || cv === 0) return versions;

  for(const migration: Migration of migrations) {
    console.log('comparin', platformVersion, migration.versionTo, compareVersions(platformVersion, migration.versionTo));
    if (compareVersions(platformVersion, migration.versionTo) === -1) versions.push(migration);
  }
  return versions;
}

