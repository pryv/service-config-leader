// @flow

/*global describe, it, beforeEach */

const settings = require('../../src/settings');
const middlewares = require('../../src/middlewares');
const authMiddleware = middlewares.authorizationAdmin(settings);
const ApiError = require('../../src/utils/errorsHandling').ApiError;
const assert = require('chai').assert;

describe('Authorization-admin middleware', function () {

  let req, res;
  beforeEach(async () => {
    req = {headers:{}, context:{}, query:{}};
    res = {};
  });

  it('fails if admin key is missing', async () => {
    const expectedErrorMsg = "Missing 'Authorization' header or 'auth' query parameter.";
    // FLOW: mocking req, res
    authMiddleware(req, res, expectAPIError(expectedErrorMsg, 403));
  });

  it('fails if admin key is invalid', async () => {
    const expectedErrorMsg = 'Invalid admin key.';
    req.headers.authorization = 'unauthorized';
    // FLOW: mocking req, res
    authMiddleware(req, res, expectAPIError(expectedErrorMsg, 403));
  });

  it('verifies admin key', async () => {
    const adminKey = settings.get('adminKey');
    req.headers.authorization = adminKey;
    // FLOW: mocking req, res
    authMiddleware(req, res, (err) => {
      assert.isUndefined(err);
    });
  });

});

function expectAPIError(msg: string, status: number) {
  return (err) => {
    assert.isNotNull(err);
    assert.isTrue(err instanceof ApiError);
    // FLOW: err is not null
    const [errMsg, errStatus] = [err.message, err.httpStatus];
    assert.strictEqual(errMsg, msg);
    assert.strictEqual(errStatus, status);
  };
}