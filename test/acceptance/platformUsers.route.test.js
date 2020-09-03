// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const assert = require('chai').assert;
const { describe, before, it, afterEach, beforeEach, after } = require('mocha');
const Chance = require('chance');
const nock = require('nock');
const Application = require('@root/app');
const app = new Application();
const request = require('supertest')(app.express);
const { sign } = require('jsonwebtoken');
const {
  PLATFORM_USERS_PERMISSIONS,
} = require('@root/models/permissions.model');

describe('/platform-users', function () {
  const registerUrl = app.settings.get('registerUrl');
  const coreUrl = app.settings.get('followers:core:url');

  const chance = new Chance();

  const user = {
    username: chance.last(),
    password: chance.word(),
    permissions: {
      users: [],
      settings: [],
      platformUsers: [
        PLATFORM_USERS_PERMISSIONS.READ,
        PLATFORM_USERS_PERMISSIONS.DELETE,
      ],
    },
  };

  const insufficientPermsUser = {
    username: chance.last(),
    password: chance.word(),
    permissions: {
      users: [],
      settings: [],
      platformUsers: [],
    },
  };

  const platformUser = {
    username: chance.last(),
    password: chance.word(),
    email: chance.email(),
    appId: chance.fbid(),
    invitationToken: chance.word(),
    referer: chance.last(),
    languageCode: chance.locale(),
  };

  let deleteAllStmt;
  let deleteAllExceptMainStmt;

  let token;

  const generateToken = function (username) {
    return sign(
      { username: username },
      app.settings.get('internals:tokenSignSecret')
    );
  };

  before(function () {
    token = generateToken(user.username);

    deleteAllStmt = app.db.prepare('DELETE FROM users;');
    deleteAllExceptMainStmt = app.db.prepare(
      'DELETE FROM users WHERE username != ?;'
    );

    deleteAllStmt.run();
    app.usersRepository.createUser(user);
  });

  afterEach(function () {
    deleteAllExceptMainStmt.run(user.username);
  });

  after(function () {
    deleteAllStmt.run();
  });

  describe('GET /', function () {
    describe('when user has sufficient permissions', function () {
      let res;
      before(async function () {
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
        assert.equal(res.body.username, platformUser.username);
        assert.equal(res.body.password, platformUser.password);
        assert.equal(res.body.email, platformUser.email);
        assert.equal(res.body.appId, platformUser.appId);
        assert.equal(res.body.invitationToken, platformUser.invitationToken);
        assert.equal(res.body.referer, platformUser.referer);
        assert.equal(res.body.languageCode, platformUser.languageCode);
      });
    });
    describe('when request to register returns an error', function () {
      let res;
      const regRespStatusCode = 423;
      before(async function () {
        nock(registerUrl)
          .get(`/admin/users/${platformUser.username}`)
          .reply(regRespStatusCode);
        res = await request
          .get(`/platform-users/${platformUser.username}`)
          .set('Authorization', token);
      });
      it('should respond with the same status code', () => {
        assert.strictEqual(res.status, regRespStatusCode);
      });
    });
    describe('when user has insufficient permissions', function () {
      let res;
      before(async function () {
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
  describe('DELETE /:username', function () {
    describe('when user has sufficient permissions', function () {
      describe('when core and register reply with 200', () => {
        let res;
        before(async function () {
          nock(registerUrl)
            .delete(`/users/${platformUser.username}?onlyReg=true`)
            .reply(200);
          nock(coreUrl).delete(`/users/${platformUser.username}`).reply(200);
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
      });
      describe('when core fails with 404, it should still delete in register', () => {
        let res;
        before(async () => {
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
      });
      describe('XXX when core fails with not 404, it should not delete in register', () => {
        let res, isRegCalled = false;
        before(async () => {
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
        it('should respond with 500', () => {
          assert.equal(res.status, 500);
        });
        it('should not call register', () => {
          assert.isFalse(isRegCalled);
        });
      });
    });
    describe('when user has insufficient permissions', function () {
      let res;
      before(async function () {
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
    });
    describe('when request to register returns an error', function () {
      let res;
      const regRespStatusCode = 423;
      before(async function () {
        nock(registerUrl)
          .delete(`/users/${platformUser.username}?onlyReg=true`)
          .reply(regRespStatusCode);
        res = await request
          .delete(`/platform-users/${platformUser.username}`)
          .set('Authorization', token);
      });
      it('should respond with the same status code', () => {
        assert.strictEqual(res.status, regRespStatusCode);
      });
    });
    describe('when request to core returns an error', function () {
      let res;
      const coreRespStatusCode = 423;
      before(async function () {
        nock(registerUrl)
          .delete(`/users/${platformUser.username}?onlyReg=true`)
          .reply(200);
        nock(coreUrl)
          .delete(`/users/${platformUser.username}`)
          .reply(coreRespStatusCode);
        res = await request
          .delete(`/platform-users/${platformUser.username}`)
          .set('Authorization', token);
      });
      it('should respond with the same status code', () => {
        assert.strictEqual(res.status, coreRespStatusCode);
      });
    });
  });
});
