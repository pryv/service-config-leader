/* global describe, before, beforeEach, it */
const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
const { assert } = require('chai');
const Application = require('@root/app');
describe('GET /conf', () => {
  let app;
  let request;
  let settings;
  let follower;
  let followerKey;
  let platformPath;
  let platform;
  before(() => {
    app = new Application();
    request = require('supertest')(app.express);
    settings = app.settings;
    followerKey = 'singlenode-machine-key';
    follower = settings.get(`followers:${followerKey}`);
    platformPath = settings.get('platformSettings:platformConfig');
    platform = fs.readFileSync(platformPath, 'utf-8');
  });
  beforeEach(() => {
    fs.writeFileSync(platformPath, platform);
  });
  it('fails if configuration folder for given role does not exist', async () => {
    const res = await request.get('/conf').set('Authorization', 'valid');
    assert.strictEqual(res.status, 404);
    const { error } = res.body;
    assert.isDefined(error);
    assert.strictEqual(
      error.message,
      "Configuration folder not found for 'unexisting'."
    );
  });
  it('serves a full configuration', async () => {
    const res = await request.get('/conf').set('Authorization', followerKey);
    assert.strictEqual(res.status, 200);
    const { files } = res.body;
    assert.exists(files);
    ['core', 'register', 'mfa'].forEach((component) => {
      const conf = files.find(
        (f) => f.path === `/${component}/conf/${component}.json`
      );
      assert.exists(conf);
      assert.deepEqual(
        conf.content.replace(/\s/g, ''),
        getExpectedConf(follower.role, component)
      );
    });
    // verify ignoring .json for .yml
    const jsonFile = files.find((f) => f.path === '/new-one/conf/new.json');
    assert.notExists(jsonFile);
    const yamlFile = files.find((f) => f.path === '/new-one/conf/new.yml');
    assert.exists(yamlFile);
    assert.deepEqual(
      yamlFile.content.replace(/\s/g, ''),
      getExpectedConf(follower.role, 'new-one', 'expected.yml', true)
    );
  });
  it('loads a fresh template from disk at each call', async () => {
    const call1 = await request.get('/conf').set('Authorization', followerKey);
    const files1 = call1.body.files;
    let coreConfig1 = files1.filter((f) => f.path.indexOf('core.json') > 0)[0]
      .content;
    coreConfig1 = JSON.parse(coreConfig1);
    assert.equal(coreConfig1.http.port, 9000);
    const path = `${settings.get('templatesPath')}/pryv/core/conf/core.json`;
    const backup = fs.readFileSync(path);
    const modifiedConfig = JSON.parse(backup);
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
  it('loads a fresh platform parameters from disk at each call', async () => {
    // Call first time
    const call1 = await request.get('/conf').set('Authorization', followerKey);
    const files1 = call1.body.files;
    let coreConfig1 = files1.filter(
      (f) => f.path.indexOf('substitute.json') > 0
    )[0].content;
    coreConfig1 = JSON.parse(coreConfig1);
    assert.equal(coreConfig1.domain, 'rec.la');
    // Modify platform.yml
    const modifiedConfig = yaml.load(platform);
    modifiedConfig.vars.MAIN_PROPS.settings.DOMAIN.value = 'test.la';
    fs.writeFileSync(platformPath, yaml.dump(modifiedConfig));
    // Check if /conf give the fresh settings
    const call2 = await request.get('/conf').set('Authorization', followerKey);
    const files2 = call2.body.files;
    let coreConfig2 = files2.filter(
      (f) => f.path.indexOf('substitute.json') > 0
    )[0].content;
    coreConfig2 = JSON.parse(coreConfig2);
    assert.equal(coreConfig2.domain, 'test.la');
  });
  it('responds with 500 given incorrect config stored', async () => {
    // Set invalid config in platform.yml
    const path = settings.get('platformSettings:platformConfig');
    const backup = fs.readFileSync(path, 'utf-8');
    const modifiedConfig = yaml.load(backup);
    modifiedConfig.vars.DNS_SETTINGS.settings.DNS_CUSTOM_ENTRIES.value = '';
    fs.writeFileSync(path, yaml.dump(modifiedConfig));
    const res = await request.get('/conf').set('Authorization', followerKey);
    assert.equal(res.status, 500);
    assert.isDefined(res.error);
    // Set platform.yml to the backup
    fs.writeFileSync(path, backup);
  });
  function getExpectedConf(
    role,
    component,
    expectedFilename = 'expected.json',
    isYaml = false
  ) {
    const dataFolder = path.resolve(settings.get('templatesPath'));
    const filePath = `${dataFolder}/${role}/${component}/conf/${expectedFilename}`;
    let expectedConf;
    if (isYaml) {
      expectedConf = fs.readFileSync(filePath, 'utf-8');
    } else {
      expectedConf = JSON.stringify(require(filePath));
    }
    return expectedConf.replace(/\s/g, '');
  }
});
