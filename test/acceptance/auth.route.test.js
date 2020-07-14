// @flow

const regeneratorRuntime = require("regenerator-runtime");

const assert = require('chai').assert;
const Application = require('@root/app');
const app = new Application();
const request = require('supertest')(app.express);
const bcrypt =  require('bcryptjs');
const _function = require("@hapi/joi/lib/types/function");

describe('Test /auth endpoint', function() {
  const user = {
    username: "some_name",
    password: "pass"
  }

  let deleteAllUsersStmt;
  let deleteAllTokensStmt;
  let createUserStmt;
  let getAllTokensStmt;

  before(function() {
    deleteAllUsersStmt = app.db.prepare("DELETE FROM users;");
    deleteAllTokensStmt = app.db.prepare("DELETE FROM blacklisted_tokens;");
    createUserStmt = app.db.prepare(
      "INSERT INTO users(username, password, permissions) VALUES(@username, @password, @permissions);");
    getAllTokensStmt = app.db.prepare("SELECT * FROM blacklisted_tokens;")

    deleteAllUsersStmt.run();
    deleteAllTokensStmt.run();
    createUserStmt.run(Object.assign({}, user, 
      { password: bcrypt.hashSync(user.password, 10), permissions: "{\"users\":\"read\"}" }));
  });

  describe('POST /auth/login', function () {
    it('should respond with 200 and token in body given valid user data', async () => {
      const res = await request
        .post('/auth/login')
        .send(user);

      assert.strictEqual(res.status, 200);
      assert.isOk(res.body.token);
    });
    it('should respond with 401 given invalid user password', async () => {
      const res = await request
        .post('/auth/login')
        .send({ username: user.username, password: "invalid_pass" });

      assert.strictEqual(res.status, 401);
      assert.isNotOk(res.body.token);
    });
    it('should respond with 404 given not existing username', async () => {
      const res = await request
        .post('/auth/login')
        .send({ username: "not_existing_name", password: "some_pass" });

      assert.strictEqual(res.status, 404);
      assert.isNotOk(res.body.token);
    });
  });
  describe('POST /auth/logout', function () {
    it('should respond with 200 and save token in db', async () => {
      const token = "some_token";

      const res = await request
        .post('/auth/logout')
        .set('Authorization', token);

      const savedTokens = getAllTokensStmt.all();

      assert.strictEqual(res.status, 200);
      assert.equal(savedTokens.length, 1);
      assert.equal(savedTokens[0].token, token);
    });
  });
});