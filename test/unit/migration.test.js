/*global describe, it, before */

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const assert = require('chai').assert;

const { migrate, checkMigrations } = require('@controller/migration');

describe('migration', () => {

  let defaultTemplatePath;
  before(() => {
    defaultTemplatePath = path.resolve(__dirname, '../../src/controller/migration/scriptsAndTemplates/cluster/1.7.0-template.yml');
  })

  describe('migrate()', () => {
    describe('when there are migrations to apply', () => {

      it('must return the migrated config: 1.6.21', async () => {
        const configFolder = path.resolve(__dirname, '../fixtures/migration-needed/1.6.21');
        const platform = parseYamlFile(path.resolve(configFolder, 'platform.yml'));
        const expected = parseYamlFile(path.resolve(configFolder, 'expected.yml'));
        const templatePath = path.resolve(__dirname, '../../src/controller/migration/scriptsAndTemplates/cluster/1.6.21-template.yml');
        const template = parseYamlFile(templatePath); // template is 1.7.0
        const { migratedPlatform } = await migrate(platform, template);
        assert.deepEqual(migratedPlatform, expected, 'config was not migrated as expected');
      });
      it('must return the migrated config: 1.7.0', async () => {
        const configFolder = path.resolve(__dirname, '../fixtures/migration-needed/1.7.0');
        const platform = parseYamlFile(path.resolve(configFolder, 'platform.yml'));
        const expected = parseYamlFile(path.resolve(configFolder, 'expected.yml'));
        const template = parseYamlFile(defaultTemplatePath);
        const { migratedPlatform } = await migrate(platform, template);
        assert.deepEqual(migratedPlatform, expected, 'config was not migrated as expected');
      });
      
    });
  });
  describe('checkAvailableMigrations()', () => {
    describe('when there are migrations to apply', () => {

      let configFolder;
      before(() => {
        configFolder = path.resolve(__dirname, '../fixtures/migration-needed/1.7.0');
      });
      it('must return the available migrations', () => {
        const platform = parseYamlFile(path.resolve(configFolder, 'platform.yml'));
        const template = parseYamlFile(defaultTemplatePath);
        const expected = [ 
          { versionsFrom: ['1.6.21'], versionTo: '1.6.22' }, 
          { versionsFrom: ['1.6.22'], versionTo: '1.6.23' }, 
          { versionsFrom: ['1.6.23'], versionTo: '1.7.0' }
        ];
        const result = checkMigrations(platform, template);
        const actual = result.migrations;
        const deploymentType = result.deploymentType;
        const withoutRuns = actual.map(m => { return { versionsFrom: m.versionsFrom, versionTo: m.versionTo };});
        assert.deepEqual(withoutRuns, expected, 'migrations were not defined properly');
        assert.equal(deploymentType, 'cluster');
      });
      
    });
    describe('when there are no migrations to apply', () => {
      let configFolder;
      before(() => {
        configFolder = path.resolve(__dirname, '../fixtures/migration-not-needed/config');
      });
      it('must return an empty array', () => {
        const platform = parseYamlFile(path.resolve(configFolder, 'platform.yml'));
        const template = parseYamlFile(defaultTemplatePath);
        const expected = [];
        const actual = checkMigrations(platform, template).migrations;
        assert.deepEqual(actual, expected, 'migrations were not defined properly');
      });
    });
    describe('when there is no migration for the target template version', () => {

    });
  });

  function parseYamlFile(path) {
    return yaml.load(fs.readFileSync(path, { encoding: 'utf-8' }));
  }
});