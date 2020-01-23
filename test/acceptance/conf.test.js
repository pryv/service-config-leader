// @flow

/*global describe, it */

const assert = require('chai').assert;
const Application = require('../../src/app');
const app = new Application();
const request = require('supertest')(app.express);
const settings = app.settings;

describe('GET /conf', function () {

  it('fails if configuration folder for given role does not exist', async () => {
    const res = await request
      .get('/conf')
      .set('Authorization', 'valid');

    assert.strictEqual(res.status, 404);
    const error = res.body.error;
    assert.isDefined(error);
    assert.strictEqual(error.message, "Configuration folder not found for 'unexisting'.");
  });

  it('serves a full configuration', async () => {
    const followerKey = 'singlenode-machine-key';
    const follower = settings.get(`followers:${followerKey}`);

    const res = await request
      .get('/conf')
      .set('Authorization', followerKey);

    assert.strictEqual(res.status, 200);
    
    const files = res.body.files;
    assert.isDefined(files);

    ['core', 'register'].forEach(component => {
      const conf = files.find(f => f.path === `/${component}/conf/${component}.json`);
      assert.isNotNull(conf);
      assert.deepEqual(conf.content.replace(/\s/g, ''), expectedConf(follower.role, component));
    });
  });

  function expectedConf(role: string, component: string) {
    const dataFolder = settings.get('pathToData');
    const expectedConf = require(`${dataFolder}/${role}/${component}/conf/expected.json`);
    return JSON.stringify(expectedConf).replace(/\s/g, '');
  }
});
