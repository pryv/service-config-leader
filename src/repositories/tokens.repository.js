/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
/**
 * @typedef {import('better-sqlite3').Database} Database
 */
/**
 * @typedef {import('better-sqlite3').Statement} Statement
 */

class TokensRepository {
  /**
   * @type {Database}
   */
  db;
  /**
   * @type {Statement}
   */
  addTokenStmt;
  /**
   * @type {Statement}
   */
  getTokenStmt;
  /**
   * @type {Statement}
   */
  deleteAllStmt;

  /**
   * @param {Database} db
   */
  constructor (db) {
    this.db = db;
    const tableCreationStatement = this.db.prepare(
      'CREATE TABLE IF NOT EXISTS blacklisted_tokens ' +
        '(token TEXT NOT NULL UNIQUE);'
    );
    tableCreationStatement.run();

    this.prepareStatements();
  }

  /**
   * @returns {void}
   */
  prepareStatements () {
    this.addTokenStmt = this.db.prepare(
      'INSERT INTO blacklisted_tokens(token) VALUES(?);'
    );
    this.getTokenStmt = this.db.prepare(
      'SELECT * FROM blacklisted_tokens WHERE token=?;'
    );
    this.deleteAllStmt = this.db.prepare('DELETE FROM blacklisted_tokens;');
  }

  /**
   * @param {string} token
   * @returns {string}
   */
  blacklist (token) {
    this.addTokenStmt.run(token);
    return token;
  }

  /**
   * @param {string} token
   * @returns {string}
   */
  contains (token) {
    const row = this.getTokenStmt.get(token);
    return !!row;
  }

  /**
   * @returns {void}
   */
  clean () {
    this.deleteAllStmt.run();
  }
}
module.exports = TokensRepository;
