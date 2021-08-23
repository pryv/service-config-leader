// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const yaml = require('js-yaml');
const fs = require('fs/promises');
const compareVersions = require('compare-versions');
const _ = require('lodash');

import type { Migration, Run } from './migrations';
const migrations: Array<Migration> = require('./migrations').migrations;

type DeploymentType = 'singlenode' | 'cluster';
type ScheduledMigration = {
  migrations: Array<Migration>,
  deploymentType: DeploymentType,
};
type ExecutedMigration = {
  migrations: Array<Migration>,
  migratedPlatform: {},
};

/**
 * migrate the platform up to the template's version
 * 
 * @param {*} platform the content of the platform.yml, used to figure out type of deployment (cluster/singlenode)
 * @param {*} template used to figure out the target version
 */
const migrate = (platform: {}, template: {}): ExecutedMigration => {
  const ScheduledMigration: ScheduledMigration = checkMigrations(platform, template);
  const migrations: Array<Migration> = ScheduledMigration.migrations;
  const deploymentType: DeploymentType = ScheduledMigration.deploymentType;
  let migratedPlatform = _.cloneDeep(platform);
  for (const migration of migrations) {
    migratedPlatform = migration[deploymentType].run(migratedPlatform, migration[deploymentType].template);
  }
  return { migratedPlatform, migrations };
}
module.exports.migrate = migrate;

/**
 * Returns the list of migrations to apply
 * 
 * @param {*} platform the platform.yml content
 * @param {*} template the template-platform.yml content
 */
const checkMigrations = (platform: {}, template: {}): ScheduledMigration => {
  validate(platform);
  validate(template);

  const platformVersion: string = platform.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value;
  const templateVersion: string = template.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value;

  const deploymentType: DeploymentType = findDeploymentType(platform);

  return { 
    migrations: computeNeededMigrations(platformVersion, templateVersion, deploymentType),
    deploymentType
  };

  function validate(conf: {}): void {
    if (
      conf.vars ==  null || 
      conf.vars.MISCELLANEOUS_SETTINGS ==  null || 
      conf.vars.MISCELLANEOUS_SETTINGS.settings ==  null || 
      conf.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION ==  null || 
      conf.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value == null
    ) throw new Error('template version missing. "vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value" undefined.');
  }

  function findDeploymentType(platform: {}): DeploymentType {
    if (platform.vars.MACHINES_AND_PLATFORM_SETTINGS.settings.SINGLE_MACHINE_IP_ADDRESS != null) return 'singlenode';
    return 'cluster';
  }
}
module.exports.checkMigrations = checkMigrations;

/**
 * Returns an array of version migrations
 * 
 * @param {*} platformVersion 
 * @param {*} templateVersion 
 */
function computeNeededMigrations(platformVersion: string, templateVersion: string, deploymentType: DeploymentType): Array<Migration> {
  const cv: number = compareVersions(platformVersion, templateVersion);
  
  const versions: Array<Migration> = [];
  if (cv === 1 || cv === 0) return versions;

  for(const migration: Migration of migrations) {
    if (
      compareVersions(platformVersion, migration.versionTo) === -1 &&
      migration[deploymentType] != null
    ) {
      versions.push(migration);
    }
  }
  return versions;
}

/**
 * load platform template from its setting value
 * 
 * @param {*} settings 
 */
const loadPlatformTemplate = async (settings: {}): {} => {
  const platformTemplate: string = settings.get('platformSettings:platformTemplate');
  if (platformTemplate == null) throw new Error('platformSettings:platformTemplate not set in config-leader.json. Config migrations will not work.');
  try {
    return yaml.load(await fs.readFile(platformTemplate, { encoding: 'utf-8' }));
  } catch (e) {
    throw new Error(`Error while reading and parsing template platform file at ${platformTemplate}. ${e}`);
  }
}
module.exports.loadPlatformTemplate = loadPlatformTemplate;

/**
 * load platform from its settings value
 * 
 * @param {*} settings 
 */
const loadPlatform = async (settings: {}): {} => {
  const platform: string = settings.get('platformSettings:platform');
  if (platform == null) throw new Error('platformSettings:platform not set in config-leader.json. Config migrations will not work.');
  try {
    return yaml.load(await fs.readFile(platform, { encoding: 'utf-8' }));
  } catch (e) {
    throw new Error(`Error while reading and parsing platform file at ${platform}. ${e}`);
  }
}
module.exports.loadPlatform = loadPlatform;

/**
 * Writes the content of platform into 'platformSettings:platform' from the setings
 * 
 * @param {*} settings 
 * @param {*} platform 
 */
const writePlatform = async (settings: {}, platform: {}): void => {

  const yamlWriteOptions: {} = {
    forceQuotes: true,
    quotingType: '"',
  };

  await fs.writeFile(settings.get('platformSettings:platform'), yaml.dump(platform, yamlWriteOptions));
}
module.exports.writePlatform = writePlatform;