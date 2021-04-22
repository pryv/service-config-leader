// @flow
const fs = require('fs');

const regeneratorRuntime = require('regenerator-runtime');

const assert = require('chai').assert;
const { describe, before, it, afterEach, after } = require('mocha');
const charlatan = require('charlatan');
const nock = require('nock');
const Application = require('@root/app');
const app = new Application();
const request = require('supertest')(app.express);
const { sign } = require('jsonwebtoken');
const {
  PLATFORM_USERS_PERMISSIONS,
} = require('@root/models/permissions.model');

describe('/platform-users', () =>  {
  const registerUrl = app.settings.get('registerUrl');
  const coreUrl = app.settings.get('followers:core:url');
  const logFilePath = app.settings.get('logs:audit:filePath');

  const auditLogPath = app.settings.get('logs:audit:filePath');
  const { DELETE_USER_ACTION, MODIFY_USER_ACTION } = require('@utils/auditLogger');

  function assertLog(user, action, platformUser, isWritten) {
    if (! isWritten) {
      return assert.isFalse(fs.existsSync(auditLogPath));
    }
    const logFileLines = fs.readFileSync(logFilePath).toString().split('\n');

    const lastLine = logFileLines[logFileLines.length - 2];
    assert.isTrue(lastLine.includes(`admin:${user} ${action} platformUser:${platformUser}`));
  }

  function cleanupLogFileIfNeeded() {
    if (fs.existsSync(auditLogPath)) {
      fs.unlinkSync(auditLogPath);
    }
  }

  const user = {
    username: charlatan.Lorem.characters(9),
    password: charlatan.Lorem.characters(9),
    permissions: {
      users: [],
      settings: [],
      platformUsers: [
        PLATFORM_USERS_PERMISSIONS.READ,
        PLATFORM_USERS_PERMISSIONS.DELETE,
        PLATFORM_USERS_PERMISSIONS.MODIFY,
      ],
    },
  };

  const insufficientPermsUser = {
    username: charlatan.Lorem.characters(9),
    password: charlatan.Lorem.characters(9),
    permissions: {
      users: [],
      settings: [],
      platformUsers: [],
    },
  };

  const platformUser = {
    username: charlatan.Lorem.characters(9),
    password: charlatan.Lorem.characters(9),
    email: charlatan.Internet.email(),
    appId: charlatan.Lorem.characters(9),
    invitationToken: charlatan.Lorem.characters(9),
    referer: charlatan.Lorem.characters(9),
    languageCode: charlatan.Lorem.characters(2),
  };

  let deleteAllStmt;
  let deleteAllExceptMainStmt;

  let token;

  const generateToken = function (username) {
    return sign(
      { username: username },
      app.settings.get('internals:configLeaderTokenSecret')
    );
  };

  before(() =>  {
    token = generateToken(user.username);

    deleteAllStmt = app.db.prepare('DELETE FROM users;');
    deleteAllExceptMainStmt = app.db.prepare(
      'DELETE FROM users WHERE username != ?;'
    );

    deleteAllStmt.run();
    app.usersRepository.createUser(user);
  });

  afterEach(() =>  {
    deleteAllExceptMainStmt.run(user.username);
  });

  after(() =>  {
    deleteAllStmt.run();
  });

  describe('GET /:username', () =>  {
    describe('when user has sufficient permissions', () =>  {
      describe('and the user exists', () => {
        let res;
        before(async () =>  {
          nock(registerUrl)
            .get(`/admin/users/${platformUser.username}`)
            .reply(200, platformUser);
  
          res = await request
            .get(`/platform-users/${platformUser.username}`)
            .set('Authorization', token);
        });
        it('should respond with 200', () => {
          assert.strictEqual(res.status, 200);
        });
        it('should respond with retrieved user in body', () => {
          assert.exists(res.body.user);
          const user = res.body.user;
          assert.equal(user.username, platformUser.username);
          assert.equal(user.password, platformUser.password);
          assert.equal(user.email, platformUser.email);
          assert.equal(user.appId, platformUser.appId);
          assert.equal(user.invitationToken, platformUser.invitationToken);
          assert.equal(user.referer, platformUser.referer);
          assert.equal(user.languageCode, platformUser.languageCode);
        });
      });
      describe('and the user does not exist', () => {
        let res;
        before(async () =>  {
          nock(registerUrl)
            .get(`/admin/users/${platformUser.username}`)
            .reply(404, platformUser);
  
          res = await request
            .get(`/platform-users/${platformUser.username}`)
            .set('Authorization', token);
        });
        it('should respond with 404', () => {
          assert.strictEqual(res.status, 404);
        });
      });
    });
    describe('when request to register returns an error', () =>  {
      let res;
      before(async () =>  {
        nock(registerUrl)
          .get(`/admin/users/${platformUser.username}`)
          .reply(423);
        res = await request
          .get(`/platform-users/${platformUser.username}`)
          .set('Authorization', token);
      });
      it('should respond with the 500 status code', () => {
        assert.strictEqual(res.status, 500);
      });
    });
    describe('when user has insufficient permissions', () =>  {
      let res;
      before(async () =>  {
        const insufficientPermsToken = generateToken(
          insufficientPermsUser.username
        );
        res = await request
          .get(`/platform-users/${platformUser.username}`)
          .set('Authorization', insufficientPermsToken);
      });
      it('should respond with 401', () => {
        assert.strictEqual(res.status, 401);
      });
    });
  });
  describe('DELETE /:username', () =>  {
    describe('when user has sufficient permissions', () =>  {
      describe('when core and register succeed', () => {
        describe('in cluster setup', () => {
          let res;
          before(async () =>  {
            nock(coreUrl).delete(`/users/${platformUser.username}`).reply(200);
            nock(registerUrl)
              .delete(`/users/${platformUser.username}?onlyReg=true`)
              .reply(200);
            res = await request
              .delete(`/platform-users/${platformUser.username}`)
              .set('Authorization', token);
          });
          it('should respond with 200', () => {
            assert.strictEqual(res.status, 200);
          });
          it('should respond with deleted username in body', () => {
            assert.equal(res.body.username, platformUser.username);
          });
          it('should write to log file', () => {
            assertLog(user.username, DELETE_USER_ACTION, platformUser.username, true);
          });
        });
        describe('in single-node setup', () => {
          let res;
          let followersBackup, registerUrlBackup;
          before(async () =>  {
            followersBackup = app.settings.get('followers');
            registerUrlBackup = app.settings.get('registerUrl');
            const app2 = new Application({nconfSettings: { followers: { abc: { url: 'myurl', role: 'singlenode' } }, registerUrl: 'http://register:9000'}});
            const request2 = require('supertest')(app2.express);
            nock('http://core:3000').delete(`/users/${platformUser.username}`).reply(200);
            nock('http://register:9000')
              .delete(`/users/${platformUser.username}?onlyReg=true`)
              .reply(200);
            res = await request2
              .delete(`/platform-users/${platformUser.username}`)
              .set('Authorization', token);
          });
          after(() => {
            app.settings.set('followers', followersBackup);
            app.settings.set('registerUrl', registerUrlBackup);
          });
          it('should respond with 200', () => {
            assert.strictEqual(res.status, 200);
          });
          it('should respond with deleted username in body', () => {
            assert.equal(res.body.username, platformUser.username);
          });
          it('should write to log file', () => {
            assertLog(user.username, DELETE_USER_ACTION, platformUser.username, true);
          });
        });
      });
      describe('when core fails with 404, it should still delete in register for idempotency', () => {
        let res;
        before(async () => {
          cleanupLogFileIfNeeded()
          nock(coreUrl).delete(`/users/${platformUser.username}`).reply(404);
          nock(registerUrl)
            .delete(`/users/${platformUser.username}?onlyReg=true`)
            .reply(200);
          res = await request
            .delete(`/platform-users/${platformUser.username}`)
            .set('Authorization', token);
        });
        it('should respond with 200', () => {
          assert.equal(res.status, 200);
        });
        it('should respond with deleted username in body', () => {
          assert.equal(res.body.username, platformUser.username);
        });
        it('should write to log file', () => {
          assertLog(user.username, DELETE_USER_ACTION, platformUser.username, true);
        });
      });
      describe('when core fails with not 404, it should not delete in register', () => {
        let res, isRegCalled = false;
        before(async () => {
          cleanupLogFileIfNeeded()
          nock(coreUrl).delete(`/users/${platformUser.username}`).reply(500);
          nock(registerUrl)
            .delete(`/users/${platformUser.username}?onlyReg=true`)
            .reply(200, () => {
              isRegCalled = true;
            });
          res = await request
            .delete(`/platform-users/${platformUser.username}`)
            .set('Authorization', token);
        });
        after(() => {
          // unregister uncalled register mock from above
          nock.cleanAll()
        })
        it('should respond with the same status code', () => {
          assert.equal(res.status, 500);
        });
        it('should not call register', () => {
          assert.isFalse(isRegCalled);
        });
        it('should not write to log file', () => {
          assertLog(user.username, DELETE_USER_ACTION, platformUser.username, false);
        });
      });
    });
    describe('when user has insufficient permissions', () =>  {
      let res;
      before(async () =>  {
        cleanupLogFileIfNeeded()
        const insufficientPermsToken = generateToken(
          insufficientPermsUser.username
        );
        res = await request
          .delete(`/platform-users/${platformUser.username}`)
          .set('Authorization', insufficientPermsToken);
      });
      it('should respond with 401', () => {
        assert.strictEqual(res.status, 401);
      });
      it('should not write to log file', () => {
        assertLog(user.username, DELETE_USER_ACTION, platformUser.username, false);
      });
    });
    describe('when request to register returns an error', () =>  {
      let res;
      before(async () =>  {
        cleanupLogFileIfNeeded()
        nock(coreUrl)
          .delete(`/users/${platformUser.username}`)
          .reply(200);
        nock(registerUrl)
          .delete(`/users/${platformUser.username}?onlyReg=true`)
          .reply(423);
        res = await request
          .delete(`/platform-users/${platformUser.username}`)
          .set('Authorization', token);
      });
      it('should respond with the 500 status code', () => {
        assert.strictEqual(res.status, 500);
      });
      it('should not write to log file', () => {
        assertLog(user.username, DELETE_USER_ACTION, platformUser.username, false);
      });
    });
    describe('when user deletion is disabled', () => {
      let request2, res;
      before(() => {
        const app2 = new Application({platformSettings: { 
          vars: { API_SETTINGS: { settings: { ACCOUNT_DELETION: { value: []}}}}
        }});
        request2 = require('supertest')(app2.express);
      });
      before(async () => {
        res = await request2
          .delete('/platform-users/doesntmatter')
          .set('Authorization', token);
      });
      it('should respond with 403', () => {
        assert.equal(res.status, 403);
      });
    });
  });
  describe('DELETE /:username/mfa', () => {
    describe('when user has sufficient permissions', () =>  {
      let res;
      before(async () =>  {
        nock(registerUrl)
          .get('/cores')
          .query({ username: platformUser.username })
          .reply(200, { core: { url: coreUrl }});
        nock(coreUrl)
          .delete(`/system/users/${platformUser.username}/mfa`)
          .reply(200, { mfaDeletion: {} });

        res = await request
          .delete(`/platform-users/${platformUser.username}/mfa`)
          .set('Authorization', token);
      });
      after(() => {
        cleanupLogFileIfNeeded();
      })
      it('should respond with 204', () => {
        assert.strictEqual(res.status, 204);
      });
      it('should write to log file', () => {
        assertLog(user.username, MODIFY_USER_ACTION, platformUser.username, true);
      });
    });
    describe('when the request to core returns an error', () =>  {
      let res;
      before(async () =>  {
        nock(registerUrl)
          .get('/cores')
          .query({ username: platformUser.username })
          .reply(200, { core: { url: coreUrl }});
        nock(coreUrl)
          .delete(`/system/users/${platformUser.username}/mfa`)
          .reply(400);
        res = await request
          .delete(`/platform-users/${platformUser.username}/mfa`)
          .set('Authorization', token);
      });
      after(() => {
        cleanupLogFileIfNeeded();
      })
      it('should respond with the 500 status code', () => {
        assert.equal(res.status, 500);
      });
      it('should not write to log file', () => {
        assertLog(user.username, MODIFY_USER_ACTION, platformUser.username, false);
      });
    });
    describe('when user has insufficient permissions', () =>  {
      let res;
      before(async () =>  {
        const insufficientPermsToken = generateToken(
          insufficientPermsUser.username
        );
        res = await request
          .delete(`/platform-users/${platformUser.username}/mfa`)
          .set('Authorization', insufficientPermsToken);
      });
      after(() => {
        cleanupLogFileIfNeeded();
      })
      it('should respond with 401', () => {
        assert.equal(res.status, 401);
      });
      it('should not write to log file', () => {
        assertLog(user.username, MODIFY_USER_ACTION, platformUser.username, false);
      });
    });
  });
});
