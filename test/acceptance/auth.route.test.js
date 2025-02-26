/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const { assert } = require('chai');
const { describe, before, it, after } = require('mocha');
const Application = require('@root/app');
const app = new Application();
const request = require('supertest')(app.express);
const { sign } = require('jsonwebtoken');
describe('Test /auth endpoint', () => {
  const user = {
    username: 'some_name',
    password: 'pass'
  };
  let deleteAllUsersStmt;
  let getAllTokensStmt;
  before(() => {
    deleteAllUsersStmt = app.db.prepare('DELETE FROM users;');
    getAllTokensStmt = app.db.prepare('SELECT * FROM blacklisted_tokens;');
    deleteAllUsersStmt.run();
    app.tokensRepository.clean();
    app.usersRepository.createUser({
      ...user,
      permissions: { users: ['read'], settings: [] }
    });
  });
  after(() => {
    deleteAllUsersStmt.run();
  });
  describe('POST /auth/login', () => {
    it('must respond with 200 and token in body given valid user data', async () => {
      const res = await request.post('/auth/login').send(user);
      assert.strictEqual(res.status, 200);
      assert.exists(res.body.token);
    });
    it('must respond with 401 given invalid user password', async () => {
      const res = await request
        .post('/auth/login')
        .send({ username: user.username, password: 'invalid_pass' });
      assert.strictEqual(res.status, 401);
      assert.notExists(res.body.token);
    });
    it('must respond with 404 given not existing username', async () => {
      const res = await request
        .post('/auth/login')
        .send({ username: 'not_existing_name', password: 'some_pass' });
      assert.strictEqual(res.status, 404);
      assert.notExists(res.body.token);
    });
  });
  describe('POST /auth/logout', () => {
    let token;
    before(() => {
      token = sign(
        { username: user.username },
        app.settings.get('internals:configLeaderTokenSecret')
      );
    });
    it('must respond with 200 and save token in db', async () => {
      const res = await request
        .post('/auth/logout')
        .set('Authorization', token);
      const savedTokens = getAllTokensStmt.all();
      assert.strictEqual(res.status, 200);
      assert.equal(savedTokens.length, 1);
      assert.equal(savedTokens[0].token, token);
    });
    it('must respond with 401 when given invalid token', async () => {
      const invalidToken = 'some_token';
      app.tokensRepository.blacklist(invalidToken);
      const res = await request
        .post('/auth/logout')
        .set('Authorization', invalidToken);
      assert.strictEqual(res.status, 401);
      assert.notExists(res.body.token);
      const savedTokens = getAllTokensStmt.all();
      assert.equal(savedTokens.length, 2);
    });
    it('must respond with 404 when given not existing user', async () => {
      app.tokensRepository.clean();
      app.usersRepository.deleteUser(user.username);
      const res = await request
        .post('/auth/logout')
        .set('Authorization', token);
      assert.strictEqual(res.status, 404);
      assert.notExists(res.body.token);
    });
  });
});
