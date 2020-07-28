// @flow

const _ = require('lodash');
const bcrypt = require('bcryptjs');
import type {
  User,
  UserNoPass,
  UserNoPerms,
  UserOptional,
  UserDB,
} from '@models/user.model';
const { Database, Statement } = require('better-sqlite3');
const cryptoRandomString = require('crypto-random-string');

export class UsersRepository {
  db: Database;
  createUserStmt: Statement;
  deleteUserStmtcreateUserStmt: Statement;
  getUserWithPasswordStmt: Statement;
  getUserWithPermissionsStmt: Statement;
  getAllUsersStmt: Statement;
  deleteUserStmt: Statement;

  constructor(db: Database) {
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

  createUser(user: User): UserNoPass {
    const passwordHash: string = bcrypt.hashSync(user.password, 10);
    const userToCreate: UserDB = Object.assign({}, user, {
      password: passwordHash,
      permissions: JSON.stringify(user.permissions),
    });

    this.createUserStmt.run(userToCreate);

    return this.sanitizeOutput(userToCreate);
  }

  findAllUsers(): Array<UserNoPass> {
    const users = this.getAllUsersStmt
      .all()
      .map((user) => this.sanitizeOutput(user));
    return users;
  }

  findUser(username: string): UserNoPass | null {
    const row = this.getUserWithPermissionsStmt.get(username);
    return row ? this.sanitizeOutput(row) : null;
  }

  isPasswordValid(user: UserNoPerms): boolean {
    console.log(user);
    const row = this.getUserWithPasswordStmt.get(user.username);
    return row && bcrypt.compareSync(user.password, row.password);
  }

  resetPassword(username: string): UserNoPerms {
    const password = cryptoRandomString({ length: 15 });

    this.updateUser(username, { password: password });
    return { username: username, password: password };
  }

  updateUser(username: string, newUser: UserOptional): UserNoPass {
    const userToUpdate: UserDB = ((newUser: any): UserDB);

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
        permissions: JSON.stringify(userToUpdate.permissions),
      });
    }

    const updateStmt = this.db.prepare(sql);

    updateStmt.run([...Object.values(userToUpdate), username]);

    return this.sanitizeOutput(userToUpdate);
  }

  deleteUser(username: string): string | null {
    const info = this.deleteUserStmt.run(username);
    if (info.changes) {
      return username;
    } else return null;
  }

  sanitizeOutput(user: any): UserNoPass {
    const sanitizedUser = _.pick(user, ['username', 'permissions']);
    if (sanitizedUser.permissions) {
      Object.assign(sanitizedUser, {
        permissions: JSON.parse(sanitizedUser.permissions),
      });
    }
    return sanitizedUser;
  }
}
