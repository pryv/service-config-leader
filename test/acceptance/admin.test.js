// @flow

/*global describe, it, before */

const assert = require('chai').assert;
const Application = require('../../src/app');
const app = new Application();
const settings = app.settings;
const platformSettings = app.platformSettings;
const request = require('supertest')(app.express);
const fs = require('fs');
const mockFollowers = require('../fixtures/followersMock');

const adminKey = settings.get('adminKey');

describe('GET /admin/settings', function () {

  it('retrieves the current platform settings', async () => {
    const res = await request
      .get('/admin/settings')
      .set('Authorization', adminKey);

    const jsonFile = JSON.parse(fs.readFileSync('platform.json', 'utf8'));
    assert.strictEqual(res.status, 200);
    assert.include(res.headers['content-type'], 'application/json');
    assert.deepEqual(res.body, jsonFile.platform);
  });
});

describe('PUT /admin/settings', function () {

  it('updates settings in memory and on disk', async () => {
    const previousSettings = platformSettings.get('platform');
    const update = {updatedProp: 'updatedVal'};
    const updatedSettings = Object.assign({}, previousSettings, update);

    const res = await request
      .put('/admin/settings')
      .send(update)
      .set('Authorization', adminKey);

    assert.strictEqual(res.status, 200);
    assert.deepEqual(res.body, updatedSettings);
    assert.deepEqual(platformSettings.get('platform'), updatedSettings);
    const jsonFile = JSON.parse(fs.readFileSync('platform.json', 'utf8'));
    assert.deepEqual(jsonFile.platform, updatedSettings);
  });
});

describe('POST /admin/notify', function () {

  before(async () => {
    // Mocking followers
    mockFollowers();
  });

  it('notifies followers and returns an array listing successes and failures', async () => {
    const res = await request
      .post('/admin/notify')
      .set('Authorization', adminKey);

    const body = res.body;
    const successes = body.successes;
    const failures = body.failures;

    assert.isDefined(failures);
    assert.isDefined(successes);

    assert.isEmpty(failures);

    const followers = settings.get('followers');
    for (const key of Object.keys(followers)) {
      assert.isDefined(successes[key]);
    }
  });
});