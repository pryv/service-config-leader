// @flow

const { Database, Statement } = require('better-sqlite3');

export class TokensRepository {
  db: Database;
  addTokenStmt: Statement;
  getTokenStmt: Statement;
  deleteAllStmt: Statement;

  constructor(db: Database) {
    this.db = db;
    const tableCreationStatement = this.db.prepare(
      'CREATE TABLE IF NOT EXISTS blacklisted_tokens ' +
        '(token TEXT NOT NULL UNIQUE);'
    );
    tableCreationStatement.run();

    this.prepareStatements();
  }

  prepareStatements() {
    this.addTokenStmt = this.db.prepare(
      'INSERT INTO blacklisted_tokens(token) VALUES(?);'
    );
    this.getTokenStmt = this.db.prepare(
      'SELECT * FROM blacklisted_tokens WHERE token=?;'
    );
    this.deleteAllStmt = this.db.prepare('DELETE FROM blacklisted_tokens;');
  }

  blacklist(token: string): string {
    this.addTokenStmt.run(token);
    return token;
  }

  contains(token: string): string {
    const row = this.getTokenStmt.get(token);
    return !!row;
  }

  clean() {
    this.deleteAllStmt.run();
  }
}
