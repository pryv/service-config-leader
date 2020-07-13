// @flow

const _ = require('lodash');
const bcrypt =  require('bcryptjs');
const User = require("./../models/user.model");
const { Database, Statement } = require("better-sqlite3");

interface IUsersRepository {
  createUser(user: User): User;
  findUser(username: string): User;
  findAllUsers(): User[];
  checkPassword(user: User): boolean;
  resetPassword(username: string): User;
  updateUser(username: string, newUser: User): User;
  deleteUser(username: string): User;
}

export class UsersRepository implements IUsersRepository {
  db: Database;
  deleteUserStmtcreateUserStmt: Statement;
  getUserWithPasswordStmt: Statement;
  getUserWithPermissionsStmt: Statement;
  getAllUsersStmt: Statement;
  deleteUserStmt: Statement;

  constructor(db: Database) {
    this.db = db;
    const tableCreationStatement = this.db.prepare('CREATE TABLE IF NOT EXISTS users ' +
      '(id INTEGER PRIMARY KEY, ' +
      'username TEXT NOT NULL UNIQUE, ' +
      'password TEXT NOT NULL, ' +
      'permissions TEXT);')
    tableCreationStatement.run();

    this.prepareStatements();
  }

  prepareStatements() {
    this.createUserStmt = this.db.prepare("INSERT INTO users(username, password, permissions) VALUES(@username, @password, @permissions);");
    this.getUserWithPasswordStmt = this.db.prepare("SELECT username, password FROM users WHERE username = ?;");
    this.getUserWithPermissionsStmt = this.db.prepare("SELECT username, permissions FROM users WHERE username = ?;");
    this.getAllUsersStmt = this.db.prepare("SELECT username, permissions FROM users;")
    this.deleteUserStmt = this.db.prepare("DELETE FROM users WHERE username = ?;");
  }

  createUser(user: User): User {
    const passwordHash = bcrypt.hashSync(user.password, 10);
    const userToCreate = Object.assign({}, user, { password: passwordHash , permissions: JSON.stringify(user.permissions)});

    this.createUserStmt.run(userToCreate);

    return this.sanitizeOutput(userToCreate);
  }

  findAllUsers(): User[] {
    const users = this.getAllUsersStmt.all().map(user => this.sanitizeOutput(user));
    return users;
  }

  findUser(username: string): User {
    const row = this.getUserWithPermissionsStmt.get(username);
    return row ? this.sanitizeOutput(row) : null;
  }

  checkPassword(user: User): boolean {
    const row = this.getUserWithPasswordStmt.get(user.username);
    return bcrypt.compareSync(user.password, row.password);
  }

  resetPassword(username: string): User {
    const password = this.randomString();
    this.updateUser(username, { password: password });
    return { password: password };
  };

  updateUser(username: string, newUser: User): User {
    const placeholders = Object.keys(newUser).map((key) => `${key} = ?`).join(', ');
    const sql = `UPDATE users SET ${placeholders} WHERE username = ?;`;

    if(newUser.password) {
      const passwordHash = bcrypt.hashSync(newUser.password, 10);
      Object.assign(newUser, { password: passwordHash });
    }
    if(newUser.permissions) {
      Object.assign(newUser, { permissions: JSON.stringify(newUser.permissions) });
    }

    const updateStmt = this.db.prepare(sql);

    updateStmt.run([...Object.values(newUser), username]);

    return this.sanitizeOutput(newUser);
  }

  deleteUser(username: string): User {
    const info = this.deleteUserStmt.run(username);
    if(info.changes) {
      return username;
    } else return null;
  }

  sanitizeOutput(user: User): User {
      const sanitizedUser = _.pick(user, ['username', 'permissions']);
      if(sanitizedUser.permissions) {
        Object.assign(sanitizedUser, { permissions : JSON.parse(sanitizedUser.permissions)});
      }
      return sanitizedUser;
  }

  randomString(): string{
    return Math.random().toString(36).substr(2, 8);
  }
}