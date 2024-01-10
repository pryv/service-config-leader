/**
 * @license
 * Copyright (C) 2019–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const { assert } = require('chai');

const { migrate, checkMigrations } = require('@controller/migration');

describe('migration', () => {
  let defaultTemplatePath;
  before(() => {
    defaultTemplatePath = path.resolve(
      __dirname,
      '../../src/controller/migration/scriptsAndTemplates/cluster/1.7.0-template.yml'
    );
  });

  describe('migrate()', () => {
    describe('when there are migrations to apply', () => {
      it.skip('must return the migrated config: 1.6.0', async () => {
        await testMigration('1.6.0');
      });

      it('must return the migrated config: 1.6.4', async () => {
        await testMigration('1.6.4');
      });

      it('must return the migrated config: 1.6.12', async () => {
        await testMigration('1.6.12');
      });

      it('must return the migrated config: 1.6.15', async () => {
        await testMigration('1.6.15');
      });

      it('must return the migrated config: 1.6.21', async () => {
        await testMigration('1.6.21');
      });

      it('must return the migrated config: 1.7.0', async () => {
        await testMigration('1.7.0');
      });

      async function testMigration (version) {
        const configFolder = path.resolve(
          __dirname,
          `../fixtures/migration-needed/${version}`
        );
        const platform = parseYamlFile(
          path.resolve(configFolder, 'platform.yml')
        );
        const expected = parseYamlFile(
          path.resolve(configFolder, 'expected.yml')
        );
        const templatePath = path.resolve(
          __dirname,
          `../../src/controller/migration/scriptsAndTemplates/cluster/${version}-template.yml`
        );
        const template = parseYamlFile(templatePath);
        const { migratedPlatform } = await migrate(platform, template);
        assert.deepEqual(
          migratedPlatform,
          expected,
          `config was not migrated as expected to v${version}`
        );
      }
    });
  });

  describe('checkAvailableMigrations()', () => {
    describe('when there are migrations to apply', () => {
      let configFolder;
      before(() => {
        configFolder = path.resolve(
          __dirname,
          '../fixtures/migration-needed/1.7.0'
        );
      });

      it('must return the available migrations', () => {
        const platform = parseYamlFile(
          path.resolve(configFolder, 'platform.yml')
        );
        const template = parseYamlFile(defaultTemplatePath);
        const expected = [
          { versionsFrom: ['1.6.21'], versionTo: '1.6.22' },
          { versionsFrom: ['1.6.22'], versionTo: '1.6.23' },
          { versionsFrom: ['1.6.23'], versionTo: '1.7.0' }
        ];
        const result = checkMigrations(platform, template);
        const actual = result.migrations;
        const { deploymentType } = result;
        const withoutRuns = actual.map((m) => ({
          versionsFrom: m.versionsFrom,
          versionTo: m.versionTo
        }));
        assert.deepEqual(
          withoutRuns,
          expected,
          'migrations were not defined properly'
        );
        assert.equal(deploymentType, 'cluster');
      });
    });

    describe('when there are no migrations to apply', () => {
      let configFolder;
      before(() => {
        configFolder = path.resolve(
          __dirname,
          '../fixtures/migration-not-needed/config'
        );
      });

      it('must return an empty array', () => {
        const platform = parseYamlFile(
          path.resolve(configFolder, 'platform.yml')
        );
        const template = parseYamlFile(defaultTemplatePath);
        const expected = [];
        const actual = checkMigrations(platform, template).migrations;
        assert.deepEqual(
          actual,
          expected,
          'migrations were not defined properly'
        );
      });
    });

    describe('when there is no migration for the target template version', () => {
      it('must throw an error', () => {
        const platform = {
          vars: {
            MISCELLANEOUS_SETTINGS: {
              settings: { TEMPLATE_VERSION: { value: '1.2.3' } }
            },
            MACHINES_AND_PLATFORM_SETTINGS: { settings: {} }
          }
        };
        const template = parseYamlFile(defaultTemplatePath);
        assert.throws(checkMigrations.bind(null, platform, template));
      });
    });
  });

  function parseYamlFile (filepath) {
    const file = yaml.load(fs.readFileSync(filepath, { encoding: 'utf-8' }));
    return file.vars;
  }
});
