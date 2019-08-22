// @flow

/*global describe, it */

const assert = require('chai').assert;
const Application = require('../../src/app');
const app = new Application();
const settings = app.settings;
const request = require('supertest')(app.express);
const fs = require('fs');

describe('GET /settings', function () {

  it('retrieves the current platform settings', async () => {
    const res = await request
      .get('/settings');

    const jsonFile = JSON.parse(fs.readFileSync('dev-config.json', 'utf8'));
    assert.strictEqual(res.status, 200);
    assert.include(res.headers['content-type'], 'application/json');
    assert.deepEqual(res.body, jsonFile.platform);
  });
});

describe('PUT /settings', function () {

  it('updates settings in memory and on disk', async () => {
    const res = await request
      .put('/settings')
      .send({
        updatedProp: 'updatedVal'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.text, 'Settings successfully updated.');
    assert.strictEqual(settings.get('platform:updatedProp'), 'updatedVal');
    const jsonFile = JSON.parse(fs.readFileSync('dev-config.json', 'utf8'));
    assert.strictEqual(jsonFile.platform.updatedProp, 'updatedVal');
  });
});
