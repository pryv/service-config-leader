/*global describe, it, before, after */

const fs = require('fs');
const assert = require('chai').assert;

const { migrateIfNeeded } = require('../../src/migration/index');

describe('migration', () => {

  describe('migrateIfNeeded()', () => {
    describe('when there are migrations to apply', () => {

      let configFolder;
      before(() => {
        configFolder = '../support/migration-needed/config';
      });
      it('must return the migrated config', async () => {
        const expected = fs.readFileSync('../support/migration-needed/result/platform.yml', { encoding: 'utf-8' });
        const actual = await migrateIfNeeded(configFolder);
        assert.deepEqual(actual, expected, 'config was not migrated as expected');
      });
      
    });
    describe('when there are no migrations to apply', () => {
      before(() => {
        const configFolder = '../support/migration-not-needed/config';
      });
    });
  });
});