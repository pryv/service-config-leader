// @flow

import TokensRepository from '@repositories/tokens.repository';

const { assert } = require('chai');
const {
  describe, beforeEach, after, it,
} = require('mocha');
const Database = require('better-sqlite3');

describe('Test Tokens Repository', () => {
  const db: Database = new Database(':memory:', { /* verbose: console.log */ });
  const tokensRepository: TokensRepository = new TokensRepository(db);
  const selectAllTokensStmt = db.prepare('SELECT * FROM blacklisted_tokens;');
  const deleteAllTokensStmt = db.prepare('DELETE FROM blacklisted_tokens;');
  const addTokenStmt = db.prepare(
    'INSERT INTO blacklisted_tokens(token) VALUES(?);',
  );

  const token = 'some_token';

  beforeEach(() => {
    deleteAllTokensStmt.run();
  });

  after(() => {
    db.close();
  });

  it('must save token in db', () => {
    tokensRepository.blacklist(token);

    const rows = selectAllTokensStmt.all();

    assert.exists(rows);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].token, token);
  });
  it('must return true if token exists in db', () => {
    addTokenStmt.run(token);

    const isSavedInDb = tokensRepository.contains(token);

    assert.exists(isSavedInDb);
  });
  it('must return false if token does not exist in db', () => {
    const isSavedInDb = tokensRepository.contains(token);

    assert.isFalse(isSavedInDb);
  });
  it('must remove all tokens from db', () => {
    addTokenStmt.run(token);
    addTokenStmt.run('token2');

    tokensRepository.clean();

    const rows = selectAllTokensStmt.all();

    assert.exists(rows);
    assert.equal(rows.length, 0);
  });
});
