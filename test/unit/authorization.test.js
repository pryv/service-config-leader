/**
 * @license
 * Copyright (C) 2019–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const settings = require('@root/settings').getSettings();
const middlewares = require('@middlewares');
const authMiddleware = middlewares.authorization(settings);
const { assert } = require('chai');

describe('Authorization middleware', () => {
  let req;
  let res;
  beforeEach(async () => {
    req = { headers: {}, context: {}, query: {} };
    res = {};
  });

  it('fails if follower key is missing', async () => {
    const expectedErrorMsg =
      "Missing 'Authorization' header or 'auth' query parameter.";
    authMiddleware(req, res, expectAPIError(expectedErrorMsg, 401));
  });

  it('fails if follower is unauthorized', async () => {
    const expectedErrorMsg = 'Invalid follower key.';
    req.headers.authorization = 'unauthorized';
    authMiddleware(req, res, expectAPIError(expectedErrorMsg, 401));
  });

  it('verifies follower key and set corresponding role in the context', async () => {
    req.headers.authorization = 'singlenode-machine-key';
    authMiddleware(req, res, (err) => {
      assert.isUndefined(err);
      assert.strictEqual(req.context.role, 'pryv');
    });
  });
});

/**
 * @param {string} msg
 * @param {number} status
 * @returns {(err: any) => void}
 */
function expectAPIError (msg, status) {
  return (err) => {
    assert.isNotNull(err);
    assert.isTrue(Object.hasOwnProperty.call(err, 'httpStatus'));
    const [errMsg, errStatus] = [err.message, err.httpStatus];
    assert.strictEqual(errMsg, msg);
    assert.strictEqual(errStatus, status);
  };
}
