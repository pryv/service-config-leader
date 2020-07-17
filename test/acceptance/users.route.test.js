// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const assert = require('chai').assert;
const { describe, before, it, afterEach, beforeEach } = require('mocha');
const Application = require('@root/app');
const app = new Application();
const request = require('supertest')(app.express);
const { sign } = require('jsonwebtoken');
const { USERS_PERMISSIONS } = require('@root/models/permissions.model');

describe('Test /users endpoint', function () {
  const user = {
    username: 'nameX',
    password: 'pass',
    permissions: {
      users: [
        USERS_PERMISSIONS.READ,
        USERS_PERMISSIONS.CREATE,
        USERS_PERMISSIONS.DELETE,
        USERS_PERMISSIONS.RESET_PASSWORD,
        USERS_PERMISSIONS.CHANGE_PERMISSIONS
      ]
    }
  };

  let deleteAllStmt;
  let deleteAllExceptMainStmt;
  let createUserStmt;
  
  const generateToken = function(username) {
    return sign({ username: username }, process.env.SECRET);
  };
  
  const permissionsListExcept = function (permissionToOmit: string) {
    return Object.values(USERS_PERMISSIONS).filter(perm => perm !== permissionToOmit);
  };
  
  const token = generateToken(user.username);

  before(function () {
    deleteAllStmt = app.db.prepare('DELETE FROM users;');
    deleteAllExceptMainStmt = app.db.prepare('DELETE FROM users WHERE username != ?;');
    createUserStmt = app.db.prepare('INSERT INTO users(username, password, permissions) VALUES(@username, @password, @permissions);');

    deleteAllStmt.run();
    createUserStmt.run(Object.assign({}, user, { permissions: JSON.stringify(user.permissions) }));
  });

  afterEach(function () {
    deleteAllExceptMainStmt.run(user.username);
  });

  describe('POST /users', function () {
    const userToCreate = {
      username: 'someName',
      password: 'somePass',
      permissions: { users: [] }
    };

    let deleteUserStmt;

    before(() => {
      deleteUserStmt = app.db.prepare('DELETE FROM users WHERE username = ?;');
    });

    afterEach(function () {
      deleteUserStmt.run(userToCreate.username);
    });

    it('should respond with 201 and created user in body', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', token)
        .send(userToCreate);

      assert.strictEqual(res.status, 201);
      assert.equal(res.body.username, userToCreate.username);
      assert.deepEqual(res.body.permissions, userToCreate.permissions);
      assert.isNotOk(res.body.password);
    });
    it('should respond with 400 given no body was provided', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', token);

      assert.strictEqual(res.status, 400);
    });
    it('should respond with 400 given user provided with missing parameter', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', token)
        .send({ username: 'nameX' });

      assert.strictEqual(res.status, 400);
    });
    it('should respond with 400 given user provided with extra parameters', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', token)
        .send(Object.assign({}, user, { some_extra_param: 4 }));

      assert.strictEqual(res.status, 400);
    });
    it('should respond with 401 given token with all permisions except create', async () => {
      const userNoCreatePerm = {
        username: 'userNoCreate',
        password: 'passx',
        permissions: { users : permissionsListExcept(USERS_PERMISSIONS.CREATE) }
      };
      createUserStmt.run(Object.assign({}, userNoCreatePerm, { permissions: JSON.stringify(userNoCreatePerm.permissions) }));

      const res = await request
        .post('/users')
        .set('Authorization', generateToken(userNoCreatePerm.username))
        .send(Object.assign({}, user, { some_extra_param: 4 }));

      assert.strictEqual(res.status, 401);
    });
  });
  describe('GET /users/:username', function () {
    const userInDb = {
      username: 'someName',
      password: 'somePass',
      permissions: { users: [] }
    };

    before(function () {
      createUserStmt.run(Object.assign({}, userInDb, { permissions: JSON.stringify(userInDb.permissions) }));
    });

    it('should respond with 200 and retrieved user in body', async () => {
      const res = await request
        .get(`/users/${userInDb.username}`)
        .set('Authorization', token);

      assert.strictEqual(res.status, 200);
      assert.equal(res.body.username, userInDb.username);
      assert.deepEqual(res.body.permissions, userInDb.permissions);
      assert.isNotOk(res.body.password);
    });
    it('should respond with 404 if requested username does not exist', async () => {
      const res = await request
        .get('/users/some_username')
        .set('Authorization', token);

      assert.strictEqual(res.status, 404);
      assert.isOk(res.body);
    });
    it('should respond with 401 given token with all permisions except read', async () => {
      const userNoReadPerm = {
        username: 'userNoRead',
        password: 'passx',
        permissions: { users : permissionsListExcept(USERS_PERMISSIONS.READ) }
      };
      createUserStmt.run(Object.assign({}, userNoReadPerm, { permissions: JSON.stringify(userNoReadPerm.permissions) }));

      const res = await request
        .get('/users/some_username')
        .set('Authorization', generateToken(userNoReadPerm));

      assert.strictEqual(res.status, 401);
    });
  });
  describe('GET /users', function () {
    before(function () {
      createUserStmt.run({ username: 'user1', password: 'some_pass1', permissions: '{}' });
      createUserStmt.run({ username: 'user2', password: 'some_pass2', permissions: '{}' });
    });

    it('should respond with 200 and retrieved users list in body', async () => {
      const res = await request
        .get('/users')
        .set('Authorization', token);

      assert.strictEqual(res.status, 200);
      assert.equal(res.body.length, 3);
      assert.equal(res.body[0].username, user.username);
      assert.deepEqual(res.body[0].permissions, user.permissions);
      assert.isNotOk(res.body[0].password);
    });
    it('should respond with 401 given token with all permisions except read', async () => {
      const userNoReadPerm = {
        username: 'userNoRead',
        password: 'passx',
        permissions: { users : permissionsListExcept(USERS_PERMISSIONS.READ) }
      };
      createUserStmt.run(Object.assign({}, userNoReadPerm, { permissions: JSON.stringify(userNoReadPerm.permissions) }));
      
      const res = await request
        .get('/users')
        .set('Authorization', generateToken(userNoReadPerm.username));

      assert.strictEqual(res.status, 401);
    });
  });
  describe('PUT /users/:username/permissions', function () {
    const userToUpdate = {
      username: 'toupdate',
      password: 'somePass',
      permissions: { users: [] }
    };

    beforeEach(function () {
      createUserStmt.run(Object.assign({}, userToUpdate, { permissions: JSON.stringify(userToUpdate.permissions) }));
    });

    it('should respond with 200 and updated user in body', async () => {
      const newPerms = {
        permissions: { 'users': ['resetPassword'] }
      };

      const res = await request
        .put(`/users/${userToUpdate.username}/permissions`)
        .set('Authorization', token)
        .send(newPerms);

      assert.strictEqual(res.status, 200);
      assert.isNotOk(res.body.username);
      assert.deepEqual(res.body.permissions, newPerms.permissions);
      assert.isNotOk(res.body.password);
    });
    it('should respond with 400 given invalid input', async () => {
      const invalidObj = {
        field1: 'xoxo',
        f2: 45
      };

      const res = await request
        .put(`/users/${userToUpdate.username}/permissions`)
        .set('Authorization', token)
        .send(invalidObj);

      assert.strictEqual(res.status, 400);
      assert.isOk(res.body);
    });
    it('should respond with 401 given token with all permisions except change permissions', async () => {
      const userNoChangePermsPerm = {
        username: 'userNoChangePerms',
        password: 'passx',
        permissions: { users : permissionsListExcept(USERS_PERMISSIONS.CHANGE_PERMISSIONS) }
      };
      createUserStmt.run(Object.assign({}, userNoChangePermsPerm, { permissions: JSON.stringify(userNoChangePermsPerm.permissions) }));

      const res = await request
        .put(`/users/${userToUpdate.username}/permissions`)
        .set('Authorization', generateToken(userNoChangePermsPerm.username))
        .send({ permissions: { users: [] } });

      assert.strictEqual(res.status, 401);
    });
  });
  describe('POST /users/:username/reset-password', function () {
    const userToResetPassFor = {
      username: 'toresetpass',
      password: 'somePass',
      permissions: { users: [] }
    };

    beforeEach(function () {
      createUserStmt.run(Object.assign({}, userToResetPassFor, { permissions: JSON.stringify(userToResetPassFor.permissions) }));
    });

    it('should respond with 200 and reseted password in body', async () => {
      const res = await request
        .post(`/users/${userToResetPassFor.username}/reset-password`)
        .set('Authorization', token);

      assert.strictEqual(res.status, 200);
      assert.isOk(res.body.password);
    });
    it('should respond with 401 given token with all permisions except reset password', async () => {
      const userNoResetPassPerm = {
        username: 'userNoResetPassPerm',
        password: 'passx',
        permissions: { users : permissionsListExcept(USERS_PERMISSIONS.RESET_PASSWORD) }
      };
      createUserStmt.run(Object.assign({}, userNoResetPassPerm, { permissions: JSON.stringify(userNoResetPassPerm.permissions) }));

      const res = await request
        .post(`/users/${userToResetPassFor.username}/reset-password`)
        .set('Authorization', generateToken(userNoResetPassPerm));

      assert.strictEqual(res.status, 401);
    });
  });
  describe('POST /users/:username/change-password', function () {
    it('should respond with 200 and username in body', async () => {
      const res = await request
        .post(`/users/${user.username}/change-password`)
        .set('Authorization', token)
        .send({ password: 'some_pass' });

      assert.strictEqual(res.status, 200);
      assert.isNotOk(res.body.password);
    });
    it('should respond with 401 given token with different username than requested', async () => {
      const username = 'userPX';

      const res = await request
        .post(`/users/${username}/change-password`)
        .set('Authorization', token)
        .send({ password: 'some_pass' });

      assert.strictEqual(res.status, 401);
    });
  });
  describe('DELETE /users/:username', function () {
    const userToDelete = {
      username: 'todel',
      password: 'somePass',
      permissions: { users: [] }
    };

    beforeEach(function () {
      createUserStmt.run(Object.assign({}, userToDelete, { permissions: JSON.stringify(userToDelete.permissions) }));
    });

    it('should respond with 200 and deleted username in body', async () => {
      const res = await request
        .delete(`/users/${userToDelete.username}`)
        .set('Authorization', token);

      assert.strictEqual(res.status, 200);
      assert.equal(res.body.username, userToDelete.username);
    });
    it('should respond with 404 given not existing username', async () => {
      const res = await request
        .delete('/users/notexistingname')
        .set('Authorization', token);

      assert.strictEqual(res.status, 404);
      assert.isOk(res.body);
    });
    it('should respond with 401 given token with all permisions except delete', async () => {
      const userNoDelPerm = {
        username: 'userNoDelPerm',
        password: 'passx',
        permissions: { users : permissionsListExcept(USERS_PERMISSIONS.DELETE) }
      };
      createUserStmt.run(Object.assign({}, userNoDelPerm, { permissions: JSON.stringify(userNoDelPerm.permissions) }));

      const res = await request
        .delete('/users/some_username')
        .set('Authorization', generateToken(userNoDelPerm.username));

      assert.strictEqual(res.status, 401);
    });
  });
});