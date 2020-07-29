// @flow

const assert = require('chai').assert;
const Database = require('better-sqlite3');
const { describe, before, it, after } = require('mocha');

import { UsersRepository } from '@repositories/users.repository';

describe('Test Users Repository', function () {
  let db: Database;
  let usersRepository;
  let selectUserStmt;

  const user = {
    username: 'some_name',
    password: 'pass',
    permissions: { some_cat: 'read' },
  };
  const newUser = {
    username: 'new_name',
    password: 'new_pass',
  };

  before(function () {
    db = new Database(':memory:', { verbose: console.log });
    usersRepository = new UsersRepository(db);
    selectUserStmt = db.prepare('SELECT * FROM users WHERE username = ?;');
  });

  after(function () {
    db.close();
  });

  describe('Create user', function () {
    let createdUser;
    let savedUser;

    before(function () {
      createdUser = usersRepository.createUser(user);
      savedUser = selectUserStmt.get(user.username);
    });

    it('should save user with hashed password and created id', function () {
      assert.exists(savedUser);
      assert.exists(savedUser.id);
      assert.exists(savedUser.password);
      assert.notEqual(savedUser.password, user.password);
      assert.equal(savedUser.permissions, JSON.stringify(user.permissions));
    });
    it('should return created user without password property', function () {
      assert.exists(createdUser);
      assert.notExists(createdUser.password);
      assert.deepEqual(createdUser.permissions, user.permissions);
    });
  });
  describe('Find user', function () {
    let foundUser;

    before(function () {
      foundUser = usersRepository.findUser(user.username);
    });

    it('should return username and permissions of the user', function () {
      assert.exists(foundUser);
      assert.exists(foundUser.username);
      assert.exists(foundUser.permissions);
    });
    it('should not return password of the user', function () {
      assert.notExists(foundUser.password);
    });
  });
  describe('Find all users', function () {
    let foundUsers;

    before(function () {
      foundUsers = usersRepository.findAllUsers();
    });

    it('should return an array with users', function () {
      assert.exists(foundUsers);
      assert.equal(foundUsers.length, 1);
      assert.exists(foundUsers[0].username, user.username);
      assert.exists(foundUsers[0].permissions, user.permissions);
    });
  });
  describe('Check password', function () {
    let checkOfValidPassword;
    let checkOfInvalidPassword;

    before(function () {
      checkOfValidPassword = usersRepository.isPasswordValid(user);
      checkOfInvalidPassword = usersRepository.isPasswordValid(
        Object.assign({}, user, { password: 'wrong_pass' })
      );
    });

    it('should return true given valid password', function () {
      assert.exists(checkOfValidPassword);
    });
    it('should return false given invalid password', function () {
      assert.isFalse(checkOfInvalidPassword);
    });
  });
  describe('Update user', function () {
    let updatedUser;
    let savedUser;

    before(function () {
      updatedUser = usersRepository.updateUser(user.username, newUser);
      savedUser = selectUserStmt.get(newUser.username);
    });

    it('should update the user with provided changes', function () {
      assert.exists(savedUser);
      assert.exists(savedUser.id);
      assert.equal(savedUser.username, newUser.username);
      assert.exists(savedUser.password);
      assert.exists(savedUser.password);
      assert.equal(savedUser.permissions, JSON.stringify(user.permissions));
    });
    it('should return updated user', function () {
      assert.exists(updatedUser);
      assert.notExists(updatedUser.password);
      assert.equal(updatedUser.username, newUser.username);
      assert.equal(updatedUser.permissions, newUser.permissions);
    });
  });
  describe('Reset password', function () {
    let savedUser;

    before(function () {
      usersRepository.resetPassword(newUser.username);
      savedUser = selectUserStmt.get(newUser.username);
    });

    it('should set random string as new user password', function () {
      assert.exists(savedUser);
      assert.exists(savedUser.id);
      assert.equal(savedUser.username, newUser.username);
      assert.exists(savedUser.password);
      assert.notEqual(savedUser.password, newUser.password);
      assert.equal(savedUser.permissions, JSON.stringify(user.permissions));
    });
  });
  describe('Delete user', function () {
    let deletedUsername;
    let deletedUser;

    before(function () {
      deletedUsername = usersRepository.deleteUser(newUser.username);
      deletedUser = selectUserStmt.get(newUser.username);
    });

    it('should return deleted user username', function () {
      assert.equal(deletedUsername, newUser.username);
    });
    it('should entirely delete user from db', function () {
      assert.notExists(deletedUser);
    });
  });
});
