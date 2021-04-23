// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const assert = require('chai').assert;
const { describe, before, it, afterEach, beforeEach, after } = require('mocha');
const Application = require('@root/app');
const app = new Application();
const request = require('supertest')(app.express);
const { sign } = require('jsonwebtoken');
const { USERS_PERMISSIONS } = require('@root/models/permissions.model');
import type { User, UserNoPerms, UserPasswordChange } from '@models/user.model';

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
        USERS_PERMISSIONS.CHANGE_PERMISSIONS,
      ],
      settings: [],
      platformUsers: [],
    },
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

  const permissionsListExcept = function (permissionToOmit?: string) {
    return Object.values(USERS_PERMISSIONS).filter(
      (perm) => perm !== permissionToOmit
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
    deleteAllStmt.run();
  });

  describe('POST /users', function () {
    const userToCreate = {
      username: 'someName',
      password: 'somePass',
      permissions: { users: [], settings: [], platformUsers: [] },
    };

    afterEach(function () {
      app.usersRepository.deleteUser(userToCreate.username);
    });

    it('must respond with 201 and created user in body', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', token)
        .send(userToCreate);

      assert.strictEqual(res.status, 201);
      assert.exists(res.body.user);
      const user = res.body.user;
      assert.equal(user.username, userToCreate.username);
      assert.deepEqual(user.permissions, userToCreate.permissions);
      assert.notExists(user.password);
    });
    it('must respond with 400 given no body was provided', async () => {
      const res = await request.post('/users').set('Authorization', token);

      assert.strictEqual(res.status, 400);
    });
    it('must respond with 400 given user provided with missing parameter', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', token)
        .send({ username: 'nameX' });

      assert.strictEqual(res.status, 400);
      assert.include(res.error.text, 'Error validating request body');
    });
    it('must respond with 400 given user provided with extra parameters', async () => {
      const res = await request
        .post('/users')
        .set('Authorization', token)
        .send(Object.assign({}, user, { some_extra_param: 4 }));

      assert.strictEqual(res.status, 400);
      assert.include(res.error.text, 'Error validating request body');
    });
    it('must respond with 401 when given token with insufficient permissions', async () => {
      const userNoCreatePerm: UserNoPerms = {
        username: 'userNoCreate',
        password: 'passx',
        permissions: { users: permissionsListExcept(USERS_PERMISSIONS.CREATE) },
      };
      app.usersRepository.createUser(((userNoCreatePerm: any): User));

      const res = await request
        .post('/users')
        .set('Authorization', generateToken(userNoCreatePerm.username))
        .send(Object.assign({}, user, { some_extra_param: 4 }));

      assert.strictEqual(res.status, 401);
      assert.include(res.error.text, 'Insufficient permissions');
    });
    it('must respond with 401 when given user with more permissions than creator', async () => {
      const userLimitedPerms: UserNoPerms = {
        username: 'userLimitedPerms',
        password: 'passx',
        permissions: {
          users: permissionsListExcept(USERS_PERMISSIONS.RESET_PASSWORD),
          settings: [],
        },
      };
      app.usersRepository.createUser(((userLimitedPerms: any): User));

      const res = await request
        .post('/users')
        .set('Authorization', generateToken(userLimitedPerms.username))
        .send(
          Object.assign({}, userToCreate, {
            permissions: {
              users: permissionsListExcept(),
              settings: [],
              platformUsers: [],
            },
          })
        );

      assert.strictEqual(res.status, 401);
      assert.include(res.error.text, 'Insufficient permissions');
    });
  });
  describe('GET /users/:username', function () {
    const userInDb = {
      username: 'someName',
      password: 'somePass',
      permissions: { users: [] },
    };

    before(function () {
      app.usersRepository.createUser(userInDb);
    });

    it('must respond with 200 and retrieved user in body', async () => {
      const res = await request
        .get(`/users/${userInDb.username}`)
        .set('Authorization', token);

      assert.strictEqual(res.status, 200);
      assert.exists(res.body.user);
      const user = res.body.user;
      assert.equal(user.username, userInDb.username);
      assert.deepEqual(user.permissions, userInDb.permissions);
      assert.notExists(user.password);
    });
    it('must respond with 404 if requested username does not exist', async () => {
      const res = await request
        .get('/users/some_username')
        .set('Authorization', token);

      assert.strictEqual(res.status, 404);
      assert.exists(res.body);
    });
    it('must respond with 401 when given token with insufficient permissions', async () => {
      const userNoReadPerm = {
        username: 'userNoRead',
        password: 'passx',
        permissions: {
          users: permissionsListExcept(USERS_PERMISSIONS.READ),
          settings: [],
          platformUsers: [],
        },
      };
      app.usersRepository.createUser(userNoReadPerm);

      const res = await request
        .get('/users/some_username')
        .set('Authorization', generateToken(userNoReadPerm));

      assert.strictEqual(res.status, 401);
      assert.include(res.error.text, 'Insufficient permissions');
    });
  });
  describe('GET /users', function () {
    before(function () {
      app.usersRepository.createUser({
        username: 'user1',
        password: 'some_pass1',
        permissions: {},
      });
      app.usersRepository.createUser({
        username: 'user2',
        password: 'some_pass2',
        permissions: {},
      });
    });

    it('must respond with 200 and retrieved users list in body', async () => {
      const res = await request.get('/users').set('Authorization', token);

      assert.strictEqual(res.status, 200);
      assert.exists(res.body.users);
      const users = res.body.users;
      assert.equal(users.length, 3);
      assert.equal(users[0].username, user.username);
      assert.deepEqual(users[0].permissions, user.permissions);
      assert.notExists(users[0].password);
    });
    it('must respond with 401 when given token with insufficient permissions', async () => {
      const userNoReadPerm = {
        username: 'userNoRead',
        password: 'passx',
        permissions: { users: permissionsListExcept(USERS_PERMISSIONS.READ) },
      };
      app.usersRepository.createUser(((userNoReadPerm: any): User));

      const res = await request
        .get('/users')
        .set('Authorization', generateToken(userNoReadPerm.username));

      assert.strictEqual(res.status, 401);
      assert.include(res.error.text, 'Insufficient permissions');
    });
  });
  describe('PUT /users/:username/permissions', function () {
    const userToUpdate = {
      username: 'toupdate',
      password: 'somePass',
      permissions: { users: [] },
    };

    beforeEach(function () {
      app.usersRepository.createUser(((userToUpdate: any): User));
    });

    it('must respond with 200 and updated user in body', async () => {
      const newPerms = {
        permissions: {
          users: ['resetPassword'],
          settings: [],
          platformUsers: [],
        },
      };

      const res = await request
        .put(`/users/${userToUpdate.username}/permissions`)
        .set('Authorization', token)
        .send(newPerms);

      assert.strictEqual(res.status, 200);
      assert.exists(res.body.user);
      const user = res.body.user;
      assert.notExists(user.username);
      assert.deepEqual(user.permissions, newPerms.permissions);
      assert.notExists(user.password);
    });
    it('must respond with 400 given invalid input', async () => {
      const invalidObj = {
        field1: 'xoxo',
        f2: 45,
      };

      const res = await request
        .put(`/users/${userToUpdate.username}/permissions`)
        .set('Authorization', token)
        .send(invalidObj);

      assert.strictEqual(res.status, 400);
      assert.exists(res.body);
      assert.include(res.error.text, 'Error validating request body');
    });
    it('must respond with 401 when given token with insufficient permissions', async () => {
      const userNoChangePermsPerm = {
        username: 'userNoChangePerms',
        password: 'passx',
        permissions: {
          users: permissionsListExcept(USERS_PERMISSIONS.CHANGE_PERMISSIONS),
        },
      };
      app.usersRepository.createUser(((userNoChangePermsPerm: any): User));

      const res = await request
        .put(`/users/${userToUpdate.username}/permissions`)
        .set('Authorization', generateToken(userNoChangePermsPerm.username))
        .send({ permissions: { users: [] } });

      assert.strictEqual(res.status, 401);
      assert.include(res.error.text, 'Insufficient permissions');
    });
  });
  describe('POST /users/:username/reset-password', function () {
    const userToResetPassFor = {
      username: 'toresetpass',
      password: 'somePass',
      permissions: { users: [] },
    };

    beforeEach(function () {
      app.usersRepository.createUser(((userToResetPassFor: any): User));
    });

    it('must respond with 200 and new password in body', async () => {
      const res = await request
        .post('/users/' + userToResetPassFor.username + '/reset-password')
        .set('Authorization', token);

      assert.equal(res.status, 200);
      assert.exists(res.body.password);
    });
    it('must respond with 401 when given token with insufficient permissions', async () => {
      const userNoResetPassPerm = {
        username: 'userNoResetPassPerm',
        password: 'passx',
        permissions: {
          users: permissionsListExcept(USERS_PERMISSIONS.RESET_PASSWORD),
        },
      };
      app.usersRepository.createUser(((userNoResetPassPerm: any): User));

      const res = await request
        .post(`/users/${userToResetPassFor.username}/reset-password`)
        .set('Authorization', generateToken(userNoResetPassPerm));

      assert.strictEqual(res.status, 401);
      assert.include(res.error.text, 'Insufficient permissions');
    });
  });
  describe('POST /users/:username/change-password', function () {
    const passwordChangeInput: UserPasswordChange = {
      oldPassword: 'oldpass',
      newPassword: 'newPass',
      newPasswordCheck: 'newPass',
    };
    const usernameToChangePasswordOn = 'usernameToChangePasswordOn';
    let tokenToChangePasswordOn;
    beforeEach(function () {
      app.usersRepository.createUser(
        (({
          username: usernameToChangePasswordOn,
          password: passwordChangeInput.oldPassword,
          permissions: {
            settings: [],
            users: [],
          },
        }: any): User)
      );
      tokenToChangePasswordOn = generateToken(usernameToChangePasswordOn);
    });

    it('must respond with 401 when given token with different username than requested', async () => {
      const username = 'userPX';

      const res = await request
        .post('/users/' + username + '/change-password')
        .set('Authorization', token)
        .send(passwordChangeInput);

      assert.strictEqual(res.status, 401);
      assert.include(res.error.text, 'Insufficient permissions');
    });
    it('must respond with 401 when given invalid old password', async () => {
      const res = await request
        .post(`/users/${usernameToChangePasswordOn}/change-password`)
        .set('Authorization', tokenToChangePasswordOn)
        .send(
          Object.assign({}, passwordChangeInput, { oldPassword: 'wrongpass' })
        );

      assert.strictEqual(res.status, 401);
      assert.include(res.error.text, 'Invalid password');
    });
    it('must respond with 400 when given not matching new passwords', async () => {
      const res = await request
        .post(`/users/${usernameToChangePasswordOn}/change-password`)
        .set('Authorization', tokenToChangePasswordOn)
        .send(
          Object.assign({}, passwordChangeInput, {
            newPasswordCheck: 'wrongpass',
          })
        );

      assert.strictEqual(res.status, 400);
      assert.include(res.error.text, 'Passwords do not match');
    });

    it('must respond with 200 and new password in body when given valid input', async () => {
      const res = await request
        .post('/users/' + usernameToChangePasswordOn + '/change-password')
        .set('Authorization', tokenToChangePasswordOn)
        .send(passwordChangeInput);

      assert.strictEqual(res.status, 200);
    });
  });
  describe('DELETE /users/:username', function () {
    const userToDelete = {
      username: 'todel',
      password: 'somePass',
      permissions: { users: [] },
    };

    beforeEach(function () {
      app.usersRepository.createUser(((userToDelete: any): User));
    });

    it('must respond with 200 and deleted username in body', async () => {
      const res = await request
        .delete('/users/' + userToDelete.username)
        .set('Authorization', token);

      assert.strictEqual(res.status, 200);
      assert.equal(res.body.username, userToDelete.username);
    });
    it('must respond with 404 given not existing username', async () => {
      const res = await request
        .delete('/users/notexistingname')
        .set('Authorization', token);

      assert.strictEqual(res.status, 404);
      assert.exists(res.body);
    });
    it('must respond with 401 when given token with insufficient permissions', async () => {
      const userNoDelPerm = {
        username: 'userNoDelPerm',
        password: 'passx',
        permissions: { users: permissionsListExcept(USERS_PERMISSIONS.DELETE) },
      };
      app.usersRepository.createUser(((userNoDelPerm: any): User));

      const res = await request
        .delete('/users/some_username')
        .set('Authorization', generateToken(userNoDelPerm.username));

      assert.strictEqual(res.status, 401);
      assert.include(res.error.text, 'Insufficient permissions');
    });
  });
});
