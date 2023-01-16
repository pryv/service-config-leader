const UsersRepository = require('@repositories/users.repository');
const { assert } = require('chai');
const Database = require('better-sqlite3');
const { describe, before, it, after } = require('mocha');

describe('Test Users Repository', () => {
  let db;
  let usersRepository;
  let selectUserStmt;
  const user = {
    username: 'some_name',
    password: 'pass',
    permissions: { some_cat: 'read' }
  };
  const newUser = {
    username: 'new_name',
    password: 'new_pass'
  };
  before(() => {
    db = new Database(':memory:', {
      /* verbose: console.log */
    });
    usersRepository = new UsersRepository(db);
    selectUserStmt = db.prepare('SELECT * FROM users WHERE username = ?;');
  });
  after(() => {
    db.close();
  });
  describe('Create user', () => {
    let createdUser;
    let savedUser;
    before(() => {
      createdUser = usersRepository.createUser(user);
      savedUser = selectUserStmt.get(user.username);
    });
    it('must save user with hashed password and created id', () => {
      assert.exists(savedUser);
      assert.exists(savedUser.id);
      assert.exists(savedUser.password);
      assert.notEqual(savedUser.password, user.password);
      assert.equal(savedUser.permissions, JSON.stringify(user.permissions));
    });
    it('must return created user without password property', () => {
      assert.exists(createdUser);
      assert.notExists(createdUser.password);
      assert.deepEqual(createdUser.permissions, user.permissions);
    });
  });
  describe('Find user', () => {
    let foundUser;
    before(() => {
      foundUser = usersRepository.findUser(user.username);
    });
    it('must return username and permissions of the user', () => {
      assert.exists(foundUser);
      assert.exists(foundUser.username);
      assert.exists(foundUser.permissions);
    });
    it('must not return password of the user', () => {
      assert.notExists(foundUser.password);
    });
  });
  describe('Find all users', () => {
    let foundUsers;
    before(() => {
      foundUsers = usersRepository.findAllUsers();
    });
    it('must return an array with users', () => {
      assert.exists(foundUsers);
      assert.equal(foundUsers.length, 1);
      assert.exists(foundUsers[0].username, user.username);
      assert.exists(foundUsers[0].permissions, user.permissions);
    });
  });
  describe('Check password', () => {
    let checkOfValidPassword;
    let checkOfInvalidPassword;
    before(() => {
      checkOfValidPassword = usersRepository.isPasswordValid(user);
      checkOfInvalidPassword = usersRepository.isPasswordValid({
        ...user,
        password: 'wrong_pass'
      });
    });
    it('must return true given valid password', () => {
      assert.exists(checkOfValidPassword);
    });
    it('must return false given invalid password', () => {
      assert.isFalse(checkOfInvalidPassword);
    });
  });
  describe('Update user', () => {
    let updatedUser;
    let savedUser;
    before(() => {
      updatedUser = usersRepository.updateUser(user.username, newUser);
      savedUser = selectUserStmt.get(newUser.username);
    });
    it('must update the user with provided changes', () => {
      assert.exists(savedUser);
      assert.exists(savedUser.id);
      assert.equal(savedUser.username, newUser.username);
      assert.exists(savedUser.password);
      assert.exists(savedUser.password);
      assert.equal(savedUser.permissions, JSON.stringify(user.permissions));
    });
    it('must return updated user', () => {
      assert.exists(updatedUser);
      assert.notExists(updatedUser.password);
      assert.equal(updatedUser.username, newUser.username);
      assert.equal(updatedUser.permissions, newUser.permissions);
    });
  });
  describe('Reset password', () => {
    let savedUser;
    before(() => {
      usersRepository.resetPassword(newUser.username);
      savedUser = selectUserStmt.get(newUser.username);
    });
    it('must set random string as new user password', () => {
      assert.exists(savedUser);
      assert.exists(savedUser.id);
      assert.equal(savedUser.username, newUser.username);
      assert.exists(savedUser.password);
      assert.notEqual(savedUser.password, newUser.password);
      assert.equal(savedUser.permissions, JSON.stringify(user.permissions));
    });
  });
  describe('Delete user', () => {
    let deletedUsername;
    let deletedUser;
    before(() => {
      deletedUsername = usersRepository.deleteUser(newUser.username);
      deletedUser = selectUserStmt.get(newUser.username);
    });
    it('must return deleted user username', () => {
      assert.equal(deletedUsername, newUser.username);
    });
    it('must entirely delete user from db', () => {
      assert.notExists(deletedUser);
    });
  });
});
