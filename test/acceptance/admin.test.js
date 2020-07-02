// @flow

/*global describe, it, before */

const assert = require('chai').assert;
const Application = require('../../src/app');
const app = new Application();
const settings = app.settings;
const platformSettings = app.platformSettings;
const request = require('supertest')(app.express);
const fs = require('fs');
const yaml = require('js-yaml');
const mockFollowers = require('../fixtures/followersMock');

const adminKey = settings.get('adminKey');

describe('GET /admin/settings', function () {

  it('retrieves the current platform settings', async () => {
    const res = await request
      .get('/admin/settings')
      .set('Authorization', adminKey);

    const ymlFile = fs.readFileSync('platform.yml', 'utf8');
    const platform = yaml.safeLoad(ymlFile);

    assert.strictEqual(res.status, 200);
    assert.include(res.headers['content-type'], 'application/json');
    assert.deepEqual(res.body, platform.vars);
  });
});

describe('PUT /admin/settings', function () {

  it('updates settings in memory and on disk', async () => {
    const previousSettings = platformSettings.get('vars');
    const update = {updatedProp: 'updatedVal'};
    const updatedSettings = Object.assign({}, previousSettings, update);

    const res = await request
      .put('/admin/settings')
      .send(update)
      .set('Authorization', adminKey);

    assert.strictEqual(res.status, 200);
    assert.deepEqual(res.body, updatedSettings);
    assert.deepEqual(platformSettings.get('vars'), updatedSettings);
    const ymlFile = fs.readFileSync('platform.yml', 'utf8');
    const platform = yaml.safeLoad(ymlFile);
    assert.deepEqual(updatedSettings, platform.vars);
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

  it('responds with CORS related headers', async () => {
    const res = await request
      .post('/admin/notify')
      .set('Authorization', adminKey);

    const headers = res.headers;

    console.log(headers);

    assert.isDefined(headers['access-control-allow-origin']);
    assert.equal(headers['access-control-allow-origin'], '*');

    assert.isDefined(headers['access-control-allow-methods']);
    assert.equal(headers['access-control-allow-methods'], 'POST, GET, PUT, OPTIONS');

    assert.isDefined(headers['access-control-allow-headers']);
    assert.equal(headers['access-control-allow-headers'], 'Authorization, Content-Type');

    assert.isDefined(headers['access-control-max-age']);

    assert.isDefined(headers['access-control-allow-credentials']);
    assert.equal(headers['access-control-allow-credentials'], 'true');
  });

  it('responds with 200 to OPTIONS request', async () => {
    const res = await request
      .options('/');

    assert.strictEqual(res.status, 200);
  });
});