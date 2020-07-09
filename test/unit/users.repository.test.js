// @flow

const assert = require('chai').assert;
const Database = require('better-sqlite3');

import { IUsersRepository, UsersRepository } from  "./../../src/repositories/users.repository";

describe('Test Users Repository', function () {

  const db: Database = new Database(':memory:', { verbose: console.log }); 
  const usersRepository: UsersRepository = new UsersRepository(db);;
  const selectUserStmt = db.prepare("SELECT * FROM users WHERE username = ?;");

  const user = {
    username: "some_name",
    password: "pass",
    permissions: [{ some_cat : "read"} ]
  }
  const newUser = {
    username : "new_name",
    password: "new_pass",
    permissions: [{"perm1":"write"}]
  }

  // before(function() {
  //   db = new Database(':memory:', { verbose: console.log });
  //   usersRepository = new UsersRepository(db);
  // });

  after(function() {
    db.close();
  });

  describe("Create user", function() {
    const createdUser = usersRepository.createUser(user);

    const savedUser = selectUserStmt.get(user.username);

    it('should save user with hashed password and created id', function() {
      assert.isOk(savedUser);
      assert.isOk(savedUser.id);
      assert.isOk(savedUser.password);
      assert.notEqual(savedUser.password, user.password);
      assert.equal(savedUser.permissions, JSON.stringify(user.permissions));
    });
    it('should return created user without password property', function() {
      assert.isOk(createdUser);
      assert.isNotOk(createdUser.password);
      assert.equal(createdUser.permissions, JSON.stringify(user.permissions));
    });
  })
  describe("Find user", function() {
    const foundUser = usersRepository.findUser(user.username);

    it('should return username and permissions of the user', function() {
      assert.isOk(foundUser);
      assert.isOk(foundUser.username);
      assert.isOk(foundUser.permissions);
    });
    it('should not return password of the user', function() {
      assert.isNotOk(foundUser.password);
    });
  })
  describe("Check password", function() {
    const checkOfValidPassword = usersRepository.checkPassword(user);
    const checkOfInvalidPassword = usersRepository.checkPassword(Object.assign({}, user, { password : "wrong_pass" }));

    it('should return true given valid password', function() {
      assert.isOk(checkOfValidPassword);
    });
    it('should return false given invalid password', function() {
      assert.isNotOk(checkOfInvalidPassword);
    });
  })
  describe("Update user", function() {
    const updatedUser = usersRepository.updateUser(user.username, newUser);

    const savedUser = selectUserStmt.get(newUser.username);

    it('should entirely update the user', function() {
      assert.isOk(savedUser);
      assert.isOk(savedUser.id);
      assert.equal(savedUser.username, newUser.username);
      assert.isOk(savedUser.password);
      assert.isOk(savedUser.password);
      assert.equal(savedUser.permissions, newUser.permissions);
    });
    it('should return updated user', function() {
      assert.isOk(updatedUser);
      assert.isNotOk(updatedUser.password);
      assert.equal(updatedUser.username, newUser.username);
      assert.equal(updatedUser.permissions, newUser.permissions);
    });
  })
  describe("Delete user", function() {
    const deletedUsername = usersRepository.deleteUser(newUser.username);

    const deletedUser = selectUserStmt.get(newUser.username);

    it('should return deleted user username', function() {
      assert.equal(deletedUsername, newUser.username);
    });
    it('should entirely delete user from db', function() {
      assert.isNotOk(deletedUser);
    });
  })
});
