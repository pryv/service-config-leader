// @flow

/*global describe, it */

const assert = require('chai').assert;
const app = require('../../src/app');
const request = require('supertest')(app);

describe('GET /machine/:machineId', function () {

  it('does not serve invalid Pryv.io machine', async () => {
    const res = await request
      .get('/machine/invalid');

    assert.strictEqual(res.status, 404);
    const error = res.body.error;
    assert.isDefined(error);
    assert.strictEqual(error.message, "Configuration folder not found for machine 'invalid'.");
  });

  it('lists the configuration files for core machine', async () => {
    const res = await request
      .get('/machine/core');

    assert.strictEqual(res.status, 200);
    assert.deepEqual(res.body[0], '/core/conf/core.json');
  });
});
