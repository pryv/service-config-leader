// @flow

/*global describe, it, before, after */

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');
const sinon = require('sinon');
const assert = require('chai').assert;
const path = require('path');
const Application = require('@root/app');
const app = new Application();
const settings = app.settings;
const platformSettings = app.platformSettings;
const supertest = require('supertest');
const request = supertest(app.express);
const fs = require('fs');
const yaml = require('js-yaml');
const mockFollowers = require('../fixtures/followersMock');
const helper = require('../fixtures/followersMockHelper');
const { sign } = require('jsonwebtoken');
const { SETTINGS_PERMISSIONS } = require('@models/permissions.model');
import type { User } from '@models/user.model';

describe('Test /admin endpoint', function () {
  let readOnlyToken;
  let updateOnlyToken;

  let deleteAllStmt;

  before(function () {
    const userOnlyReadPerm: User = {
      username: 'userOnlyReadPerm',
      password: 'pass',
      permissions: {
        settings: [SETTINGS_PERMISSIONS.READ],
        users: [],
      },
    };
    const userOnlyUpdatePerm: User = {
      username: 'userOnlyUpdatePerm',
      password: 'pass',
      permissions: {
        settings: [SETTINGS_PERMISSIONS.UPDATE],
        users: [],
      },
    };

    deleteAllStmt = app.db.prepare('DELETE FROM users;');

    deleteAllStmt.run();

    app.usersRepository.createUser(userOnlyReadPerm);
    app.usersRepository.createUser(userOnlyUpdatePerm);

    readOnlyToken = sign(
      { username: userOnlyReadPerm.username },
      settings.get('internals:configLeaderTokenSecret')
    );
    updateOnlyToken = sign(
      { username: userOnlyUpdatePerm.username },
      settings.get('internals:configLeaderTokenSecret')
    );
  });

  after(function () {
    deleteAllStmt.run();
  });

  it('responds with CORS related headers', async () => {
    const res = await request
      .put('/admin/settings')
      .set('Authorization', updateOnlyToken)
      .send({});

    const headers = res.headers;

    assert.isDefined(headers['access-control-allow-origin']);
    assert.equal(headers['access-control-allow-origin'], '*');

    assert.isDefined(headers['access-control-allow-methods']);
    assert.equal(
      headers['access-control-allow-methods'],
      'POST, GET, PUT, OPTIONS, DELETE'
    );

    assert.isDefined(headers['access-control-allow-headers']);
    assert.equal(
      headers['access-control-allow-headers'],
      'Authorization, Content-Type'
    );

    assert.isDefined(headers['access-control-max-age']);

    assert.isDefined(headers['access-control-allow-credentials']);
    assert.equal(headers['access-control-allow-credentials'], 'true');
  });
  it('responds with 200 to OPTIONS request', async () => {
    const res = await request.options('/');

    assert.strictEqual(res.status, 200);
  });

  describe('GET /admin/settings', function () {
    it('retrieves the current platform settings', async () => {
      const res = await request
        .get('/admin/settings')
        .set('Authorization', readOnlyToken);

      const ymlFile = fs.readFileSync('platform.yml', 'utf8');
      const platform = yaml.load(ymlFile);

      assert.strictEqual(res.status, 200);
      assert.include(res.headers['content-type'], 'application/json');
      assert.deepEqual(res.body.settings, platform.vars);
    });
    it('must return 401 when given token with insufficient permissions', async () => {
      const res = await request
        .get('/admin/settings')
        .set('Authorization', updateOnlyToken);

      assert.strictEqual(res.status, 401);
    });
  });

  describe('PUT /admin/settings', function () {
    it('updates settings in memory and on disk', async () => {
      const previousSettings = platformSettings.get('vars');
      const update = {
        updatedProp: { settings: { SOME_SETTING: { value: 'updatedVal' } } },
      };
      const updatedSettings = Object.assign({}, previousSettings, update);

      const res = await request
        .put('/admin/settings')
        .send(update)
        .set('Authorization', updateOnlyToken);

      assert.strictEqual(res.status, 200);
      assert.deepEqual(res.body.settings, updatedSettings);
      assert.deepEqual(platformSettings.get('vars'), updatedSettings);
      const ymlFile = fs.readFileSync('platform.yml', 'utf8');
      const platform = yaml.load(ymlFile);
      assert.deepEqual(updatedSettings, platform.vars);
    });
    it('must respond with 400 when given properties that create invalid config', async () => {
      const invalidProps = {
        ADVANCED_API_SETTINGS: {
          settings: {
            INVITATION_TOKENS: {
              value: '',
            },
            VERSIONING_SETTINGS: {
              value: 55,
            },
          },
        },
      };

      const res = await request
        .put('/admin/settings')
        .set('Authorization', updateOnlyToken)
        .send(invalidProps);

      assert.strictEqual(res.status, 400);
    });
    it('must return 401 when given token with insufficient permissions', async () => {
      const res = await request
        .put('/admin/settings')
        .set('Authorization', readOnlyToken);

      assert.strictEqual(res.status, 401);
    });
  });

  describe('POST /admin/notify', function () {
    beforeEach(async () => {
      // Mocking followers
      mockFollowers.server();
    });

    it('must notify followers and returns an array listing successes and failures', async () => {
      const res = await request
        .post('/admin/notify')
        .set('Authorization', updateOnlyToken);

      const body = res.body;
      const successes = body.successes;
      const failures = body.failures;

      assert.isDefined(failures);
      assert.isDefined(successes);
      const followers = settings.get('followers');
      for (const [token, follower] of Object.entries(followers)) {
        if (token === 'failing') {
          const failure = failures.find(failure => failure.url === follower.url);
          assert.exists(failure);
          assert.equal(failure.role, follower.role);
        } else {
          const success = successes.find(success => success.url === follower.url);
          assert.exists(success);
          assert.equal(success.role, follower.role);
        }
      }
    });
    it('must return 401 when given token with insufficient permissions', async () => {
      const res = await request
        .post('/admin/notify')
        .set('Authorization', readOnlyToken);

      assert.strictEqual(res.status, 401);
    });

    it('must notify followers to restart some services', async () => {
      const services = ['service1', 'service2'];
      let spy = sinon.spy(helper, 'spy');
      const res = await request
        .post('/admin/notify')
        .set('Authorization', updateOnlyToken)
        .send({ services: services });
      assert.strictEqual(res.status, 200);
      sinon.assert.calledWith(spy, services);
      spy.restore();
    });

    it('must notify followers to restart all services', async () => {
      let spy = sinon.spy(helper, 'spy');
      const res = await request
        .post('/admin/notify')
        .set('Authorization', updateOnlyToken);
      assert.strictEqual(res.status, 200);
      sinon.assert.calledWith(spy, undefined);
      spy.restore();
    });
  });

  describe('GET /admin/migrations', function () {

    let templatePath;
    before(() => {
      templatePath = path.resolve(__dirname, '../../src/controller/migration/scriptsAndTemplates/cluster/1.7.0-template.yml');
    })

    describe('when there is an update', () => {

      let request;
      before(() => {
        const app = new Application({
          nconfSettings: {
            platformSettings: {
              platform: path.resolve(__dirname, '../fixtures/migration-needed/1.7.0/platform.yml'),
              platformTemplate: templatePath,
            }
          }
        });
        request = supertest(app.express);
      });

      describe('when the user has sufficient permissions', () => {
        it('must return the list of migrations to perform', async () => {
          const res = await request
            .get('/admin/migrations')
            .set('Authorization', readOnlyToken);
          assert.equal(res.status, 200);
          const migrations = res.body.migrations;
          assert.exists(migrations);
          assert.deepEqual(migrations, [
            { versionsFrom: ['1.6.21'], versionTo: '1.6.22' }, 
            { versionsFrom: ['1.6.22'], versionTo: '1.6.23' }, 
            { versionsFrom: ['1.6.23'], versionTo: '1.7.0' }
          ]);
        });
      });
      describe('when the user has insufficient permissions', () => {
        it('must return a 401 error', async () => {
          const res = await request
            .get('/admin/migrations')
            .set('Authorization', updateOnlyToken);
          assert.equal(res.status, 401);
        });
      });
    });
    describe('when there is no update', () => {
      describe('when the user has sufficient permissions', () => {

        let request;
        before(() => {
          const app = new Application({
            nconfSettings: {
              platformSettings: {
                platform: path.resolve(__dirname, '../fixtures/migration-not-needed/config/platform.yml'),
                platformTemplate: templatePath,
              }
            }
          });
          request = supertest(app.express);
        });

        it('must return an empty list', async () => {
          const res = await request
            .get('/admin/migrations')
            .set('Authorization', readOnlyToken);
          assert.equal(res.status, 200);
          assert.deepEqual(res.body.migrations, []);
        });
      });
    });

  });

  describe('POST /admin/migrations', function () {

    let templatePath;
    before(() => {
      templatePath = path.resolve(__dirname, '../../src/controller/migration/scriptsAndTemplates/cluster/1.7.0-template.yml');
    });

    describe('when there is an update', () => {

      let request, backupPlatform, platformPath, expectedPlatform;
      before(async () => {
        platformPath = path.resolve(__dirname, '../fixtures/migration-needed/1.7.0/platform.yml');
        expectedPlatform = yaml.load(fs.readFileSync(path.resolve(__dirname, '../fixtures/migration-needed/1.7.0/expected.yml'), 'utf-8'));
        const app = new Application({
          nconfSettings: {
            platformSettings: {
              platform: platformPath,
              platformTemplate: templatePath,
            }
          }
        });
        await app.init();
        request = supertest(app.express);
        backupPlatform = fs.readFileSync(platformPath, 'utf-8');
      });

      describe('when the user has sufficient permissions', () => {

        describe('when the configuration is correct', () => {
          after(() => {
            fs.writeFileSync(platformPath, backupPlatform);
          });
          it('must migrate the platform configuration and return the executed migrations', async function () {
            if (process.env.IS_CI) {
              // for some reason, in CI, the "git commit" action can't figure out the author
              this.skip(); 
            }
            const res = await request
              .post('/admin/migrations')
              .set('Authorization', updateOnlyToken);
            assert.equal(res.status, 200);
            const migrations = res.body.migrations;
            assert.deepEqual(migrations, [
              { versionsFrom: ['1.6.21'], versionTo: '1.6.22' }, 
              { versionsFrom: ['1.6.22'], versionTo: '1.6.23' }, 
              { versionsFrom: ['1.6.23'], versionTo: '1.7.0' }
            ]);
            const migratedPlatform = yaml.load(fs.readFileSync(platformPath));
            assert.deepEqual(migratedPlatform, expectedPlatform);
          });
        })

        describe('when there is an error in the platform.yml', () => {
          let request, platformPath, originalPlatform;
          before(() => {
            platformPath = path.resolve(__dirname, '../fixtures/migration-broken/config/platform.yml');
            const app = new Application({
              nconfSettings: {
                platformSettings: {
                  platform: platformPath,
                  platformTemplate: templatePath,
                }
              }
            });
            request = supertest(app.express);
            originalPlatform = fs.readFileSync(platformPath, 'utf-8' );
          });
          it('must return a 400 error and not alter the platform.yml', async () => {
            const res = await request
              .post('/admin/migrations')
              .set('Authorization', updateOnlyToken);
            assert.equal(res.status, 500);
            assert.equal(fs.readFileSync(platformPath, 'utf-8' ), originalPlatform);
          });
        });
      });
      describe('when the user has insufficient permissions', () => {
        it('must return a 401 error', async () => {
          const res = await request
            .post('/admin/migrations')
            .set('Authorization', readOnlyToken);
          assert.equal(res.status, 401);
        });
      });
    });
    describe('when there is no update', () => {
      describe('when the user has sufficient permissions', () => {

        let request, backupPlatform, platformPath;
        before(() => {
          platformPath = path.resolve(__dirname, '../fixtures/migration-not-needed/config/platform.yml');
          const app = new Application({
            nconfSettings: {
              platformSettings: {
                platform: platformPath,
                platformTemplate: templatePath,
              }
            }
          });
          request = supertest(app.express);
          backupPlatform = fs.readFileSync(platformPath, 'utf-8');
        });
        after(() => {
          fs.writeFileSync(platformPath, backupPlatform);
        })

        it('must not alter the platform configuration and return an empty list', async () => {
          const res = await request
            .post('/admin/migrations')
            .set('Authorization', updateOnlyToken);
          assert.equal(res.status, 200);
          assert.deepEqual(res.body.migrations, []);
          const platform = yaml.load(fs.readFileSync(platformPath));
          assert.deepEqual(platform, yaml.load(backupPlatform));
        });
      });
    });

  });
});
