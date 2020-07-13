// @flow

/*global describe, it, beforeEach */

const regeneratorRuntime = require("regenerator-runtime");

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

  it('fails if follower key is missing', async () => {
    const expectedErrorMsg = "Missing 'Authorization' header or 'auth' query parameter.";
    // FLOW: mocking req, res
    authMiddleware(req, res, expectAPIError(expectedErrorMsg, 401));
  });

  it('fails if follower is unauthorized', async () => {
    const expectedErrorMsg = 'Invalid follower key.';
    req.headers.authorization = 'unauthorized';
    // FLOW: mocking req, res
    authMiddleware(req, res, expectAPIError(expectedErrorMsg, 401));
  });

  it('verifies follower key and set corresponding role in the context', async () => {
    req.headers.authorization = 'singlenode-machine-key';
    // FLOW: mocking req, res
    authMiddleware(req, res, (err) => {
      assert.isUndefined(err);
      assert.strictEqual(req.context.role, 'pryv');
    });
  });

});

function expectAPIError(msg: string, status: number) {
  return (err) => {
    assert.isNotNull(err);
    assert.isTrue(err.hasOwnProperty("httpStatus"));
    // FLOW: err is not null
    const [errMsg, errStatus] = [err.message, err.httpStatus];
    assert.strictEqual(errMsg, msg);
    assert.strictEqual(errStatus, status);
  };
}