/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const yaml = require('js-yaml');
const fs = require('fs/promises');
const compareVersions = require('compare-versions');
const _ = require('lodash');
const logger = require('@utils/logging').getLogger('migration');
const { setupGit, getGit } = require('./git');
const { migrations } = require('./migrations');

module.exports.setupGit = setupGit;
module.exports.getGit = getGit;

/**
 * migrate the platform up to the template's version
 *
 * @param {*} platform the content of the platform.yml, used to figure out type of deployment (cluster/singlenode)
 * @param {*} template used to figure out the target version
 */
const migrate = (platform, template) => {
  const ScheduledMigration = checkMigrations(platform, template);
  const { migrations } = ScheduledMigration;
  const { deploymentType } = ScheduledMigration;
  let migratedPlatform = _.cloneDeep(platform);
  for (const migration of migrations) {
    migratedPlatform = migration[deploymentType].run(migratedPlatform, migration[deploymentType].template);
  }
  return { migratedPlatform, migrations };
};
module.exports.migrate = migrate;

/**
 * Returns the list of migrations to apply
 *
 * @param {*} platform the platform.yml content
 * @param {*} template the template-platform.yml content
 */
const checkMigrations = (platform, template) => {
  validate(platform, 'platform.yml');
  validate(template, 'template-platform.yml');

  const platformVersion = platform.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value;
  const targetVersion = template.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value;

  const deploymentType = findDeploymentType(platform);
  return {
    migrations: computeNeededMigrations(platformVersion, targetVersion, deploymentType),
    deploymentType
  };

  function validate (conf, filename) {
    if (conf?.MISCELLANEOUS_SETTINGS?.settings?.TEMPLATE_VERSION?.value == null) throw new Error(`template version missing in ${filename}. "MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value" is undefined. Please fix the service's configuration files`);
  }
  function findDeploymentType (platform) {
    if (platform.MACHINES_AND_PLATFORM_SETTINGS.settings.SINGLE_MACHINE_IP_ADDRESS != null) return 'singlenode';
    return 'cluster';
  }
};
module.exports.checkMigrations = checkMigrations;

/**
 * Returns an array of version migrations
 *
 * @param {string} platformVersion  undefined
 * @param {string} targetVersion  undefined
 * @returns {any[]}
 */
function computeNeededMigrations (platformVersion, targetVersion) {
  const foundMigrations = [];

  if (platformVersion === targetVersion) return foundMigrations;

  let versionCounter = platformVersion;
  for (let i = 0; i < migrations.length && isSmallerOrEqual(migrations[i].versionTo, targetVersion); i++) {
    const migration = migrations[i];
    if (isPartOfVersionsFrom(migration.versionsFrom, versionCounter)) {
      foundMigrations.push(migration);
      versionCounter = migration.versionTo;
    }
  }

  if (isSmallerOrEqual(platformVersion, targetVersion) && foundMigrations.length === 0) {
    throw new Error(`No migration available from ${platformVersion} to ${targetVersion}. Contact Pryv support for more information`);
  }

  logger.info(`available migrations found: ${foundMigrations.map((m) => ({ from: m.versionsFrom, to: m.versionTo }))}`);
  return foundMigrations;

  function isPartOfVersionsFrom (versionsFrom, targetVersion) {
    return versionsFrom.includes(targetVersion);
  }

  /**
   * checks if versionA is smaller or equal to versionB
   *
   * @param {*} versionA
   * @param {*} versionB
   */
  function isSmallerOrEqual (versionA, versionB) {
    const cv = compareVersions(versionA, versionB);
    return cv === -1 || cv === 0;
  }
}

/**
 * load platform template from its setting value
 *
 * @param {*} settings
 */
const loadPlatformTemplate = async (settings) => {
  const platformTemplate = settings.get('platformSettings:platformTemplate');
  if (platformTemplate == null) throw new Error('platformSettings:platformTemplate not set in config-leader.json. Config migrations will not work.');
  try {
    const template = yaml.load(await fs.readFile(platformTemplate, { encoding: 'utf-8' }));
    return template.vars;
  } catch (e) {
    throw new Error(`Error while reading and parsing template platform file at ${platformTemplate}. ${e}`);
  }
};
module.exports.loadPlatformTemplate = loadPlatformTemplate;

/**
 * @typedef {"singlenode" | "cluster"} DeploymentType
 */

/**
 * @typedef {{
 *   migrations: Array<Migration>
 *   deploymentType: DeploymentType
 * }} ScheduledMigration
 */

/**
 * @typedef {{
 *   migrations: Array<Migration>
 *   migratedPlatform: {}
 * }} ExecutedMigration
 */
