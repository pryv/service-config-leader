// @flow

/*global describe, it */

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

const path = require('path');
const fs = require('fs');
const assert = require('chai').assert;
const Application = require('@root/app');
const app = new Application();
const request = require('supertest')(app.express);
const settings = app.settings;

describe('GET /conf', function () {
  const followerKey = 'singlenode-machine-key';
  const follower = settings.get(`followers:${followerKey}`);

  it('fails if configuration folder for given role does not exist', async () => {
    const res = await request.get('/conf').set('Authorization', 'valid');

    assert.strictEqual(res.status, 404);
    const error = res.body.error;
    assert.isDefined(error);
    assert.strictEqual(
      error.message,
      'Configuration folder not found for \'unexisting\'.'
    );
  });

  it('serves a full configuration', async () => {
    const res = await request.get('/conf').set('Authorization', followerKey);

    assert.strictEqual(res.status, 200);

    const files = res.body.files;
    assert.isDefined(files);

    ['core', 'register'].forEach((component) => {
      const conf = files.find(
        (f) => f.path === `/${component}/conf/${component}.json`
      );
      assert.isNotNull(conf);
      assert.deepEqual(
        conf.content.replace(/\s/g, ''),
        expectedConf(follower.role, component)
      );
    });
  });

  it('loads a fresh configuration from disk at each call', async () => {
    let path = settings.get('templatesPath') + '/pryv/core/conf/core.json';
    let backup = fs.readFileSync(path);
    let modifiedConfig = JSON.parse(backup);
    modifiedConfig.a = 1;
    fs.writeFileSync(path, JSON.stringify(modifiedConfig, null, 2));
    const res = await request.get('/conf').set('Authorization', followerKey);
    const files = res.body.files;
    assert.isDefined(files);
    let coreConfig = files.filter((f) => f.path.indexOf('core.json') > 0)[0]
      .content;
    coreConfig = JSON.parse(coreConfig);
    assert.equal(coreConfig.a, 1);
    fs.writeFileSync(path, backup);
  });

  function expectedConf(role: string, component: string) {
    const dataFolder = path.resolve(settings.get('templatesPath'));
    const expectedConf = require(`${dataFolder}/${role}/${component}/conf/expected.json`);
    return JSON.stringify(expectedConf).replace(/\s/g, '');
  }
});
