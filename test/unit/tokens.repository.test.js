// @flow

const assert = require('chai').assert;
const { describe, beforeEach, after, it } = require('mocha');
const Database = require('better-sqlite3');

import { TokensRepository } from '@repositories/tokens.repository';

describe('Test Tokens Repository', function () {
  const db: Database = new Database(':memory:', { verbose: console.log });
  const tokensRepository: TokensRepository = new TokensRepository(db);
  const selectAllTokensStmt = db.prepare('SELECT * FROM blacklisted_tokens;');
  const deleteAllTokensStmt = db.prepare('DELETE FROM blacklisted_tokens;');
  const addTokenStmt = db.prepare(
    'INSERT INTO blacklisted_tokens(token) VALUES(?);'
  );

  const token = 'some_token';

  beforeEach(function () {
    deleteAllTokensStmt.run();
  });

  after(function () {
    db.close();
  });

  it('should save token in db', function () {
    tokensRepository.blacklist(token);

    const rows = selectAllTokensStmt.all();

    assert.exists(rows);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].token, token);
  });
  it('should return true if token exists in db', function () {
    addTokenStmt.run(token);

    const isSavedInDb = tokensRepository.contains(token);

    assert.exists(isSavedInDb);
  });
  it('should return false if token does not exist in db', function () {
    const isSavedInDb = tokensRepository.contains(token);

    assert.isFalse(isSavedInDb);
  });
  it('should remove all tokens from db', function () {
    addTokenStmt.run(token);
    addTokenStmt.run('token2');

    tokensRepository.clean();

    const rows = selectAllTokensStmt.all();

    assert.exists(rows);
    assert.equal(rows.length, 0);
  });
});
