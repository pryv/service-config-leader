const _ = require('lodash');
const bcrypt = require('bcryptjs');
const { Database, Statement } = require('better-sqlite3');
const cryptoRandomString = require('crypto-random-string');

class UsersRepository {
  /**
   * @type {Database}
   */
  db;
  /**
   * @type {Statement}
   */
  createUserStmt;
  /**
   * @type {Statement}
   */
  deleteUserStmtcreateUserStmt;
  /**
   * @type {Statement}
   */
  getUserWithPasswordStmt;
  /**
   * @type {Statement}
   */
  getUserWithPermissionsStmt;
  /**
   * @type {Statement}
   */
  getAllUsersStmt;
  /**
   * @type {Statement}
   */
  deleteUserStmt;

  /**
   * @param {Database} db
   */
  constructor(db) {
    this.db = db;
    const tableCreationStatement = this.db.prepare(
      'CREATE TABLE IF NOT EXISTS users ' +
        '(id INTEGER PRIMARY KEY, ' +
        'username TEXT NOT NULL UNIQUE, ' +
        'password TEXT NOT NULL, ' +
        'permissions TEXT);'
    );
    tableCreationStatement.run();
    this.prepareStatements();
  }

  /**
   * @returns {void}
   */
  prepareStatements() {
    this.createUserStmt = this.db.prepare(
      'INSERT INTO users(username, password, permissions) VALUES(@username, @password, @permissions);'
    );
    this.getUserWithPasswordStmt = this.db.prepare(
      'SELECT username, password FROM users WHERE username = ?;'
    );
    this.getUserWithPermissionsStmt = this.db.prepare(
      'SELECT username, permissions FROM users WHERE username = ?;'
    );
    this.getAllUsersStmt = this.db.prepare(
      'SELECT username, permissions FROM users;'
    );
    this.deleteUserStmt = this.db.prepare(
      'DELETE FROM users WHERE username = ?;'
    );
  }

  /**
   * @param {User} user
   * @returns {any}
   */
  createUser(user) {
    const passwordHash = bcrypt.hashSync(user.password, 10);
    const userToCreate = {
      ...user,
      password: passwordHash,
      permissions: JSON.stringify(user.permissions)
    };
    this.createUserStmt.run(userToCreate);
    return UsersRepository.sanitizeOutput(userToCreate);
  }

  /**
   * @returns {any[]}
   */
  findAllUsers() {
    const users = this.getAllUsersStmt
      .all()
      .map((user) => UsersRepository.sanitizeOutput(user));
    return users;
  }

  /**
   * @param {string} username
   * @returns {any}
   */
  findUser(username) {
    const row = this.getUserWithPermissionsStmt.get(username);
    return row ? UsersRepository.sanitizeOutput(row) : null;
  }

  /**
   * @param {UserNoPerms} user
   * @returns {boolean}
   */
  isPasswordValid(user) {
    const row = this.getUserWithPasswordStmt.get(user.username);
    return row && bcrypt.compareSync(user.password, row.password);
  }

  /**
   * @param {string} username
   * @returns {any}
   */
  resetPassword(username) {
    const password = cryptoRandomString({ length: 15 });
    this.updateUser(username, { password });
    return { username, password };
  }

  /**
   * @param {string} username
   * @param {UserOptional} newUser
   * @returns {any}
   */
  updateUser(username, newUser) {
    const userToUpdate = newUser;
    const placeholders = Object.keys(userToUpdate)
      .map((key) => `${key} = ?`)
      .join(', ');
    const sql = `UPDATE users SET ${placeholders} WHERE username = ?;`;
    if (userToUpdate.password) {
      const passwordHash = bcrypt.hashSync(userToUpdate.password, 10);
      Object.assign(userToUpdate, { password: passwordHash });
    }
    if (userToUpdate.permissions) {
      Object.assign(userToUpdate, {
        permissions: JSON.stringify(userToUpdate.permissions)
      });
    }
    const updateStmt = this.db.prepare(sql);
    updateStmt.run([...Object.values(userToUpdate), username]);
    return UsersRepository.sanitizeOutput(userToUpdate);
  }

  /**
   * @param {string} username
   * @returns {string}
   */
  deleteUser(username) {
    const info = this.deleteUserStmt.run(username);
    if (info.changes) {
      return username;
    }
    return null;
  }

  /**
   * @static
   * @param {any} user
   * @returns {any}
   */
  static sanitizeOutput(user) {
    const sanitizedUser = _.pick(user, ['username', 'permissions']);
    if (sanitizedUser.permissions) {
      Object.assign(sanitizedUser, {
        permissions: JSON.parse(sanitizedUser.permissions)
      });
    }
    return sanitizedUser;
  }
}
module.exports = UsersRepository;
