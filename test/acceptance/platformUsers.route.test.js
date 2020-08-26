// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const assert = require('chai').assert;
const { describe, before, it, afterEach, beforeEach, after } = require('mocha');
const Chance = require('chance');
const Application = require('@root/app');
const app = new Application();
const request = require('supertest')(app.express);
const { sign } = require('jsonwebtoken');
const {
  PLATFORM_USERS_PERMISSIONS,
} = require('@root/models/permissions.model');

describe('Test /users endpoint', function () {
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

  before(() => {
    token = generateToken(user.username);
  });

  before(function () {
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
    deleteAllStmt.run(user.username);
  });

  describe('GET /platform-users', function () {
    describe('when user has sufficient permissions', function () {
      let res;
      before(async function () {
        res = await request.get('/platform-users').set('Authorization', token);
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
    describe('when user has insufficient permissions', function () {
      let res;
      before(async function () {
        const insufficientPermsToken = generateToken(
          insufficientPermsUser.username
        );
        res = await request
          .get('/platform-users')
          .set('Authorization', insufficientPermsToken);
      });
      it('should respond with 401', () => {
        assert.strictEqual(res.status, 401);
      });
    });
  });
  describe('DELETE /platform-users/:username', function () {
    describe('when user has sufficient permissions', function () {
      let res;
      before(async function () {
        res = await request
          .delete(`/platform-users/${platformUser.username}`)
          .set('Authorization', token);
      });
      it('should respond with 200', () => {
        assert.strictEqual(res.status, 200);
      });
      it('should respond with deleted user in body', () => {
        assert.equal(res.body.username, platformUser.username);
        assert.equal(res.body.password, platformUser.password);
        assert.equal(res.body.email, platformUser.email);
        assert.equal(res.body.appId, platformUser.appId);
        assert.equal(res.body.invitationToken, platformUser.invitationToken);
        assert.equal(res.body.referer, platformUser.referer);
        assert.equal(res.body.languageCode, platformUser.languageCode);
      });
      it('should respond with 404 given not existing username', async () => {
        res = await request
          .delete('/platform-users/someusername')
          .set('Authorization', token);

        assert.strictEqual(res.status, 404);
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
  });
});
