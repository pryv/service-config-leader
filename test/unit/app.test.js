// @flow

/*global describe, it, before*/

const fs = require('fs');

const assert = require('chai').assert;
const Application = require('@root/app');
const path = require('path');
const cuid = require('cuid');
const { tmpdir } = require('os');

describe('Application', function () {

  describe('constructor', () => {
    it('generates random secrets at startup, if needed', () => {
      const app = new Application();
      const internals = app.settings.get('internals');
  
      assert.strictEqual(internals['SECRET_ONE'], '1234');
      assert.match(internals['SECRET_TWO'], /^[a-z0-9]{32}$/);
    });
  
    it('generates admin credentials at startup and writes it to credentials file and database', () => {
      const app = new Application();
      const credentialsPath = app.settings.get('credentials:filePath');
  
      const password = fs.readFileSync(credentialsPath, {encoding: 'utf-8'});
      
      const isPasswordValid = app.usersRepository.isPasswordValid({
        username: 'initial_user',
        password: password,
      });
  
      assert.isTrue(isPasswordValid);
    });
  });

  describe('init()', () => {
    let app, gitFolder;
    before(() => {
      gitFolder = path.resolve(tmpdir(), cuid());
      fs.mkdirSync(gitFolder);
      app = new Application({
        nconfSettings: { gitRepoPath: gitFolder }
      });
    });
    it('must initialise a git repository', async () => {
      await app.init();
      const stats = fs.statSync(path.resolve(gitFolder, '.git'));
      assert.isTrue(stats.isDirectory());
    });

  });

  
});
