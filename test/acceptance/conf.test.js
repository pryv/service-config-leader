// @flow

/*global describe, it */

const assert = require('chai').assert;
const app = require('../../src/app');
const request = require('supertest')(app);

describe('GET /conf/:component', function () {

  it('does not serve invalid Pryv.io component', async () => {
    const res = await request
      .get('/conf/core/conf/invalid.json');

    assert.strictEqual(res.status, 404);
    const error = res.body.error;
    assert.isDefined(error);
    assert.strictEqual(error.message, 'Configuration file not found: core/conf/invalid.json');
  });

  it('serves the core configuration file', async () => {
    const res = await request
      .get('/conf/core/conf/core.json');

    const expectedConf = require('../fixtures/configs/core.json');

    assert.strictEqual(res.status, 200);
    assert.deepEqual(res.text, JSON.stringify(expectedConf, 'utf8', 2));
  });

  it('serves the register configuration file', async () => {
    const res = await request
      .get('/conf/register/conf/register.json');

    const expectedConf = require('../fixtures/configs/register.json');

    assert.strictEqual(res.status, 200);
    assert.deepEqual(res.text, JSON.stringify(expectedConf, 'utf8', 2));
  });
});
