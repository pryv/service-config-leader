// @flow

/*global describe, it */

const assert = require('chai').assert;
const app = require('../../src/app');
const request = require('supertest')(app);

describe('GET /conf/:component', function () {

  it('does not serve invalid Pryv.io component', async () => {
    const res = await request
      .get('/conf/invalid');

    assert.strictEqual(res.status, 404);
    const error = res.body.error;
    assert.isDefined(error);
    assert.strictEqual(error.message, 'Configuration file not found: templates/invalid.json');
  });

  it('serves the core configuration as JSON object', async () => {
    const res = await request
      .get('/conf/core');

    const expectedConf = require('../fixtures/configs/core.json');

    assert.strictEqual(res.status, 200);
    assert.include(res.headers['content-type'], 'application/json');

    assert.deepEqual(res.body, expectedConf);
  });

  it('serves the register configuration as JSON object', async () => {
    const res = await request
      .get('/conf/register');

    const expectedConf = require('../fixtures/configs/register.json');

    assert.strictEqual(res.status, 200);
    assert.include(res.headers['content-type'], 'application/json');

    assert.deepEqual(res.body, expectedConf);
  });
});
