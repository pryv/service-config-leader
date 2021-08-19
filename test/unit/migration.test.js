/*global describe, it, before, after */

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const assert = require('chai').assert;

const { migrate, checkMigrations } = require('../../dist/controller/migration');

describe('XXXmigration', () => {

  describe('migrate()', () => {
    describe('when there are migrations to apply', () => {

      let configFolder;
      before(() => {
        configFolder = path.resolve(__dirname, '../support/migration-needed/config');
      });
      it('must return the migrated config', async () => {
        const platform = parsePlatformFile(configFolder);
        const template = parseTemplateFile(configFolder);
        const expected = parsePlatformFile(path.resolve(configFolder, '../result'));
        const actual = await migrate(platform, template);
        assert.deepEqual(actual, expected, 'config was not migrated as expected');
      });
      
    });
  });
  describe('checkAvailableMigrations()', () => {
    describe('when there are migrations to apply', () => {

      let configFolder;
      before(() => {
        configFolder = path.resolve(__dirname, '../support/migration-needed/config');
      });
      it('must return the available migrations', () => {
        const platform = parsePlatformFile(configFolder);
        const template = parseTemplateFile(configFolder);
        const expected = [ 
          { versionFrom: '1.6.21', versionTo: '1.6.22' }, 
          { versionFrom: '1.6.23', versionTo: '1.7.0' }
        ];
        const result = checkMigrations(platform, template);
        const actual = result.migrations;
        const deploymentType = result.deploymentType;
        const withoutRuns = actual.map(m => { return { versionFrom: m.versionFrom, versionTo: m.versionTo };});
        assert.deepEqual(withoutRuns, expected, 'migrations were not defined properly');
        assert.equal(deploymentType, 'cluster');
      });
      
    });
    describe('when there are no migrations to apply', () => {
      let configFolder;
      before(() => {
        configFolder = path.resolve(__dirname, '../support/migration-not-needed/config');
      });
      it('must return an empty array', () => {
        const platform = parsePlatformFile(configFolder);
        const template = parseTemplateFile(configFolder);
        const expected = [];
        const actual = checkMigrations(platform, template);
        assert.deepEqual(actual, expected, 'migrations were not defined properly');
      });
    });
  });

  function parsePlatformFile(configFolder) {
    return yaml.load(fs.readFileSync(path.resolve(configFolder, 'platform.yml'), { encoding: 'utf-8' }));
  }
  function parseTemplateFile(configFolder) {
    return yaml.load(fs.readFileSync(path.resolve(configFolder, 'template-platform.yml'), { encoding: 'utf-8' }));
  }
});