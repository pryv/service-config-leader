// @flow

const regeneratorRuntime = require("regenerator-runtime");

const assert = require('chai').assert;
const Application = require('../../src/app');
const app = new Application();
const request = require('supertest')(app.express);
const { sign } = require('jsonwebtoken');
const { USERS_PERMISSIONS } = require("./../../src/models/permissions.model");

describe('Test /users endpoint', function() {
  const user = {
    username: "some_name",
    password: "pass",
    permissions: { users : [ 
      USERS_PERMISSIONS.READ, 
      USERS_PERMISSIONS.CREATE, 
      USERS_PERMISSIONS.DELETE, 
      USERS_PERMISSIONS.RESET_PASSWORD, 
      USERS_PERMISSIONS.CHANGE_PERMISSIONS 
    ]}
  }

  let deleteAllStmt;

  const generateToken = function(permissions: string[]) {
    return sign({ username: user.username, permissions: { users: permissions }}, process.env.SECRET);
  };

  const permissionsListExcept = function(permissionToOmit: string) {
    return Object.values(USERS_PERMISSIONS).filter(perm => perm !== permissionToOmit);
  };

  before(function() {
    deleteAllStmt = app.db.prepare("DELETE FROM users;");
  });

  afterEach(function() {
    deleteAllStmt.run();
  });

  describe('POST /users', function() {
    const deleteUserStmt = app.db.prepare("DELETE FROM users WHERE username = ?;");

    afterEach(function() {
      deleteUserStmt.run(user.username);
    });

    it('should respond with 201 and created user in body', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', generateToken([ USERS_PERMISSIONS.CREATE ]))
        .send(user);
  
      assert.strictEqual(res.status, 201);
      assert.equal(res.body.username, user.username);
      assert.deepEqual(res.body.permissions, user.permissions);
      assert.isNotOk(res.body.password);
    });
    it('should respond with 400 given no body was provided', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', generateToken([ USERS_PERMISSIONS.CREATE ]));
  
      assert.strictEqual(res.status, 400);
    });
    it('should respond with 400 given user provided with missing parameter', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', generateToken([ USERS_PERMISSIONS.CREATE ]))
        .send({ username: "nameX" });

      assert.strictEqual(res.status, 400);
    });
    it('should respond with 400 given user provided with extra parameters', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', generateToken([ USERS_PERMISSIONS.CREATE ]))
        .send(Object.assign({}, user, { some_extra_param : 4 }));
  
      assert.strictEqual(res.status, 400);
    });
    it('should respond with 401 given token with all permisions except create', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', generateToken(permissionsListExcept(USERS_PERMISSIONS.CREATE)))
        .send(Object.assign({}, user, { some_extra_param : 4 }));
  
      assert.strictEqual(res.status, 401);
    });
  });
  describe('GET /users/:username', function() {
    const createUserStmt = app.db.prepare(
      "INSERT INTO users(username, password, permissions) VALUES(@username, @password, @permissions);");

    before(function() {
      createUserStmt.run(Object.assign({}, user, { permissions: JSON.stringify(user.permissions) }));
    });

    it('should respond with 200 and retrieved user in body', async () => {
      const res = await request
        .get(`/users/${user.username}`)
        .set('Authorization', generateToken([ USERS_PERMISSIONS.READ ]));
  
      assert.strictEqual(res.status, 200);
      assert.equal(res.body.username, user.username);
      assert.deepEqual(res.body.permissions, user.permissions);
      assert.isNotOk(res.body.password);
    });
    it('should respond with 404 if requested username does not exist', async () => {
      const res = await request
        .get(`/users/some_username`)
        .set('Authorization', generateToken([ USERS_PERMISSIONS.READ ]));
  
      assert.strictEqual(res.status, 404);
      assert.isOk(res.body);
    });
    it('should respond with 401 given token with all permisions except read', async () => {
      const res = await request
        .get(`/users/some_username`)
        .set('Authorization', generateToken(permissionsListExcept(USERS_PERMISSIONS.READ)));
  
      assert.strictEqual(res.status, 401);
    });
  });
  describe('GET /users', function() {
    const createUserStmt = app.db.prepare(
      "INSERT INTO users(username, password, permissions) VALUES(@username, @password, @permissions);");

    before(function() {
      createUserStmt.run(Object.assign({}, user, { permissions: JSON.stringify(user.permissions) }));
      createUserStmt.run({ username: "user1", password: "some_pass1", permissions : "{}"});
      createUserStmt.run({ username: "user2", password: "some_pass2", permissions : "{}"});
    });

    it('should respond with 200 and retrieved users list in body', async () => {
      const res = await request
        .get(`/users`)
        .set('Authorization', generateToken([ USERS_PERMISSIONS.READ ]));
  
      assert.strictEqual(res.status, 200);
      assert.equal(res.body.length, 3);
      assert.equal(res.body[0].username, user.username);
      assert.deepEqual(res.body[0].permissions, user.permissions);
      assert.isNotOk(res.body[0].password);
    });
    it('should respond with 401 given token with all permisions except create', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', generateToken(permissionsListExcept(USERS_PERMISSIONS.CREATE)))
        .send(Object.assign({}, user, { some_extra_param : 4 }));
  
      assert.strictEqual(res.status, 401);
    });
    it('should respond with 401 given token with all permisions except read', async () => {
      const res = await request
        .get(`/users`)
        .set('Authorization', generateToken(permissionsListExcept(USERS_PERMISSIONS.READ)));
  
      assert.strictEqual(res.status, 401);
    });
  });
  describe('PUT /users/:username/permissions', function() {
    const createUserStmt = app.db.prepare(
      "INSERT INTO users(username, password, permissions) VALUES(@username, @password, @permissions);");

    beforeEach(function() {
      createUserStmt.run(Object.assign({}, user, { permissions: JSON.stringify(user.permissions) }));
    });

    it('should respond with 200 and updated user in body', async () => {
      const newPerms = {
        permissions: { "users" : [ "resetPassword" ] }
      };

      const res = await request
        .put(`/users/${user.username}/permissions`)
        .set('Authorization', generateToken([ USERS_PERMISSIONS.CHANGE_PERMISSIONS ]))
        .send(newPerms);
      
      assert.strictEqual(res.status, 200);
      assert.isNotOk(res.body.username);
      assert.deepEqual(res.body.permissions, newPerms.permissions);
      assert.isNotOk(res.body.password);
    });
    it('should respond with 400 given invalid input', async () => {
      const invalidObj = {
        field1: "xoxo",
        f2: 45
      };

      const res = await request
        .put(`/users/${user.username}/permissions`)
        .set('Authorization', generateToken([ USERS_PERMISSIONS.CHANGE_PERMISSIONS ]))
        .send(invalidObj);
  
      assert.strictEqual(res.status, 400);
      assert.isOk(res.body);
    });
    it('should respond with 401 given token with all permisions except change permissions', async () => {
      const res = await request
        .put(`/users/${user.username}/permissions`)
        .set('Authorization', generateToken(permissionsListExcept(USERS_PERMISSIONS.CHANGE_PERMISSIONS)))
        .send({ permissions: { users: []}});
  
      assert.strictEqual(res.status, 401);
    });
  });
  describe('POST /users/:username/reset-password', function() {
    const createUserStmt = app.db.prepare(
      "INSERT INTO users(username, password, permissions) VALUES(@username, @password, @permissions);");

    beforeEach(function() {
      createUserStmt.run(Object.assign({}, user, { permissions: JSON.stringify(user.permissions) }));
    });

    it('should respond with 200 and reseted password in body', async () => {
      const res = await request
        .post(`/users/${user.username}/reset-password`)
        .set('Authorization', generateToken([ USERS_PERMISSIONS.RESET_PASSWORD ]));
      
      assert.strictEqual(res.status, 200);
      assert.isOk(res.body.password);
    });
    it('should respond with 401 given token with all permisions except reset password', async () => {
      const res = await request
        .post(`/users/${user.username}/reset-password`)
        .set('Authorization', generateToken(permissionsListExcept(USERS_PERMISSIONS.RESET_PASSWORD)));
  
      assert.strictEqual(res.status, 401);
    });
  });
  describe('DELETE /users/:username', function() {
    const createUserStmt = app.db.prepare(
      "INSERT INTO users(username, password, permissions) VALUES(@username, @password, @permissions);");

    beforeEach(function() {
      createUserStmt.run(Object.assign({}, user, { permissions: JSON.stringify(user.permissions) }));
    });

    it('should respond with 200 and deleted username in body', async () => {
      const res = await request
        .delete(`/users/${user.username}`)
        .set('Authorization', generateToken([ USERS_PERMISSIONS.DELETE ]));
  
      assert.strictEqual(res.status, 200);
      assert.equal(res.body.username, user.username);
    });
    it('should respond with 404 given not existing username', async () => {
      const res = await request
        .delete(`/users/user1`)
        .set('Authorization', generateToken([ USERS_PERMISSIONS.DELETE ]));
  
      assert.strictEqual(res.status, 404);
      assert.isOk(res.body);
    });
    it('should respond with 401 given token with all permisions except delete', async () => {
      const res = await request
        .delete(`/users/some_username`)
        .set('Authorization', generateToken(permissionsListExcept(USERS_PERMISSIONS.DELETE)));
  
      assert.strictEqual(res.status, 401);
    });
  });
});