// @flow

/*global describe, it */

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');
const yaml = require('yamljs')

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
    const call1 = await request.get('/conf').set('Authorization', followerKey);
    const files1 = call1.body.files;
    let coreConfig1 = files1.filter((f) => f.path.indexOf('core.json') > 0)[0]
      .content;
    coreConfig1 = JSON.parse(coreConfig1);
    assert.equal(coreConfig1.http.port, 9000);

    let path = settings.get('templatesPath') + '/pryv/core/conf/core.json';
    let backup = fs.readFileSync(path);
    let modifiedConfig = JSON.parse(backup);
    modifiedConfig.http.port = 8000;
    fs.writeFileSync(path, JSON.stringify(modifiedConfig, null, 2));
    const call2 = await request.get('/conf').set('Authorization', followerKey);
    const files2 = call2.body.files;
    assert.isDefined(files2);
    let coreConfig = files2.filter((f) => f.path.indexOf('core.json') > 0)[0]
      .content;
    coreConfig = JSON.parse(coreConfig);
    assert.equal(coreConfig.http.port, 8000);
    fs.writeFileSync(path, backup);
  });

  it('loads a fresh settings from disk at each call', async () => {
    // Call first time
    const call1 = await request.get('/conf').set('Authorization', followerKey);
    const files1 = call1.body.files;
    let coreConfig1 = files1.filter((f) => f.path.indexOf('subsitute.json') > 0)[0].content;
    coreConfig1 = JSON.parse(coreConfig1);
    assert.equal(coreConfig1.domain, 'rec.la');

    // Modify platform.yml
    let path = settings.get('databasePath') + 'platform.yml';
    let backup = fs.readFileSync(path);
    let modifiedConfig = yaml.load(path);
    modifiedConfig.vars.MAIN_PROPS.settings.DOMAIN.value = "test.la";
    fs.writeFileSync(path, yaml.stringify(modifiedConfig));

    // Check if /conf give the fresh settings
    const call2 = await request.get('/conf').set('Authorization', followerKey);
    const files2 = call2.body.files;
    let coreConfig2 = files2.filter((f) => f.path.indexOf('subsitute.json') > 0)[0].content;
    coreConfig2 = JSON.parse(coreConfig2);
    assert.equal(coreConfig2.domain, 'test.la');

    // Set platform.yml to the backup
    fs.writeFileSync(path, backup);

  })

  it('responds with 500 given incorrect config stored', async () => {
    // Set invalid config in platform.yml
    let path = settings.get('databasePath') + 'platform.yml';
    let backup = fs.readFileSync(path);
    let modifiedConfig = yaml.load(path);
    modifiedConfig.vars.DNS_SETTINGS.settings.DNS_CUSTOM_ENTRIES.value = "";
    fs.writeFileSync(path, yaml.stringify(modifiedConfig));

    const res = await request.get('/conf').set('Authorization', followerKey);
    assert.equal(res.status, 500);
    assert.isDefined(res.error);

    // Set platform.yml to the backup
    fs.writeFileSync(path, backup);
  });

  function expectedConf(role: string, component: string) {
    const dataFolder = path.resolve(settings.get('templatesPath'));
    const expectedConf = require(`${dataFolder}/${role}/${component}/conf/expected.json`);
    return JSON.stringify(expectedConf).replace(/\s/g, '');
  }
});
