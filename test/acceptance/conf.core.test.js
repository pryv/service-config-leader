// @flow

/*global describe, it */

const assert = require('chai').assert;
const app = require('../../src/app');
const request = require('supertest')(app);

describe('GET /conf/core', function () {

  it('serves the core configuration as JSON object', async () => {
    const res = await request
      .get('/conf/core');

    const expectedConf = require('../fixtures/configs/coreFull.json');

    assert.strictEqual(res.status, 200);
    assert.include(res.headers['content-type'], 'application/json');

    assert.deepEqual(res.body, expectedConf);
  });
});
