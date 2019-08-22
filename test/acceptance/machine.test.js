// @flow

/*global describe, it */

const assert = require('chai').assert;
const Application = require('../../src/app');
const app = new Application();
const request = require('supertest')(app.express);

describe('GET /machine', function () {

  it('fails if configuration folder for requesting machine does not exist', async () => {
    const res = await request
      .get('/machine')
      .set('Authorization', 'valid');

    assert.strictEqual(res.status, 404);
    const error = res.body.error;
    assert.isDefined(error);
    assert.strictEqual(error.message, "Configuration folder not found for machine 'valid'.");
  });

  it('lists the configuration files for core machine', async () => {
    const res = await request
      .get('/machine')
      .set('Authorization', 'core-machine-key');

    assert.strictEqual(res.status, 200);
    assert.deepEqual(res.body[0], '/core/conf/core.json');
  });
});
