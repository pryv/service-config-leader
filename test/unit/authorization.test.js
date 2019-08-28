// @flow

/*global describe, it, beforeEach */

const settings = require('../../src/settings');
const middlewares = require('../../src/middlewares');
const authMiddleware = middlewares.authorization(settings);
const ApiError = require('../../src/utils/errorsHandling').ApiError;
const assert = require('chai').assert;

describe('Authorization middleware', function () {

  let req, res;
  beforeEach(async () => {
    req = {headers:{}, context:{}, query:{}};
    res = {};
  });

  it('fails if machine key is missing', async () => {
    const expectedErrorMsg = "Missing 'Authorization' header or 'auth' query parameter.";
    authMiddleware(req, res, expectAPIError(expectedErrorMsg, 403));
  });

  it('fails if machine is unauthorized', async () => {
    const expectedErrorMsg = 'Invalid follower key.';
    req.headers.authorization = 'unauthorized';
    authMiddleware(req, res, expectAPIError(expectedErrorMsg, 403));
  });

  it('verifies machine key and set corresponding role in the context', async () => {
    req.headers.authorization = 'singlenode-machine-key';
    authMiddleware(req, res, (err) => {
      assert.isUndefined(err);
      assert.strictEqual(req.context.role, 'pryv');
    });
  });

});

function expectAPIError(msg: string, status: number) {
  return (err) => {
    assert.isNotNull(err);
    assert.isTrue(err instanceof ApiError);
    assert.strictEqual(err.message, msg);
    assert.strictEqual(err.httpStatus, status);
  };
}