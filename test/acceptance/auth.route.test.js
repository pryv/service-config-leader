// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require("regenerator-runtime");

const assert = require("chai").assert;
const { describe, before, it, after } = require("mocha");
const Application = require("@root/app");
const app = new Application();
const request = require("supertest")(app.express);
const { sign } = require("jsonwebtoken");

describe("Test /auth endpoint", function () {
  const user = {
    username: "some_name",
    password: "pass",
  };

  let deleteAllUsersStmt;
  let getAllTokensStmt;

  before(function () {
    deleteAllUsersStmt = app.db.prepare("DELETE FROM users;");
    getAllTokensStmt = app.db.prepare("SELECT * FROM blacklisted_tokens;");

    deleteAllUsersStmt.run();
    app.tokensRepository.clean();
    app.usersRepository.createUser(
      Object.assign({}, user, {
        permissions: { users: ["read"] },
      })
    );
  });

  after(() => {
    deleteAllUsersStmt.run();
  });

  describe("POST /auth/login", function () {
    it("should respond with 200 and token in body given valid user data", async () => {
      const res = await request.post("/auth/login").send(user);

      assert.strictEqual(res.status, 200);
      assert.exists(res.body.token);
    });
    it("should respond with 401 given invalid user password", async () => {
      const res = await request
        .post("/auth/login")
        .send({ username: user.username, password: "invalid_pass" });

      assert.strictEqual(res.status, 401);
      assert.notExists(res.body.token);
    });
    it("should respond with 404 given not existing username", async () => {
      const res = await request
        .post("/auth/login")
        .send({ username: "not_existing_name", password: "some_pass" });

      assert.strictEqual(res.status, 404);
      assert.notExists(res.body.token);
    });
  });
  describe("POST /auth/logout", function () {
    let token;

    before(() => {
      token = sign(
        { username: user.username },
        app.settings.get("internals:tokenSignSecret")
      );
    });

    it("should respond with 401 when given invalid token", async () => {
      const res = await request
        .post("/auth/logout")
        .set("Authorization", "some_token");

      assert.strictEqual(res.status, 401);
      assert.notExists(res.body.token);

      const savedTokens = getAllTokensStmt.all();

      assert.equal(savedTokens.length, 0);
    });
    it("should respond with 404 when given not existing user", async () => {
      app.usersRepository.deleteUser(user.username);

      const res = await request
        .post("/auth/logout")
        .set("Authorization", token);

      assert.strictEqual(res.status, 404);
      assert.notExists(res.body.token);
    });
    it("should respond with 200 and save token in db", async () => {
      app.usersRepository.createUser(
        Object.assign({}, user, {
          permissions: { users: ["read"] },
        })
      );

      const res = await request
        .post("/auth/logout")
        .set("Authorization", token);

      const savedTokens = getAllTokensStmt.all();

      assert.strictEqual(res.status, 200);
      assert.equal(savedTokens.length, 1);
      assert.equal(savedTokens[0].token, token);
    });
  });
});
