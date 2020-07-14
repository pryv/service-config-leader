// @flow

/*global describe, it, beforeEach */

const regeneratorRuntime = require("regenerator-runtime");

const settings = require('@root/settings');
const middlewares = require('@middlewares');
const authMiddleware = middlewares.authorizationAdmin(settings);
const ApiError = require('@utils/errorsHandling').ApiError;
const assert = require('chai').assert;

describe('Authorization-admin middleware', function () {

  let req, res;
  beforeEach(async () => {
    settings.set('adminKey', '4dmink3y');
    req = {headers:{}, context:{}, query:{}};
    res = {};
  });

  it('fails if no admin key is configured', async () => {
    settings.set('adminKey', null);
    const expectedErrorMsg = "Please provide an administration key as the 'adminKey' setting.";
    // FLOW: mocking req, res
    authMiddleware(req, res, expectAPIError(expectedErrorMsg, 401));
  });

  it('fails if admin key is missing', async () => {
    const expectedErrorMsg = "Missing 'Authorization' header or 'auth' query parameter.";
    // FLOW: mocking req, res
    authMiddleware(req, res, expectAPIError(expectedErrorMsg, 401));
  });

  it('fails if admin key is invalid', async () => {
    const expectedErrorMsg = 'Invalid admin key.';
    req.headers.authorization = 'unauthorized';
    // FLOW: mocking req, res
    authMiddleware(req, res, expectAPIError(expectedErrorMsg, 401));
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
    assert.isTrue(err.hasOwnProperty("httpStatus"));
    // FLOW: err is not null
    const [errMsg, errStatus] = [err.message, err.httpStatus];
    assert.strictEqual(errMsg, msg);
    assert.strictEqual(errStatus, status);
  };
}