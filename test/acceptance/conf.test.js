// @flow

/*global describe, it */

const assert = require('chai').assert;
const Application = require('../../src/app');
const app = new Application();
const request = require('supertest')(app.express);

describe('GET /conf/*', function () {

  it('fails if requested configuration file does not exist', async () => {
    const res = await request
      .get('/conf/core/conf/invalid.json')
      .set('Authorization', 'valid');

    assert.strictEqual(res.status, 404);
    const error = res.body.error;
    assert.isDefined(error);
    assert.strictEqual(error.message, 'Configuration file not found: core/conf/invalid.json');
  });
  
  it('fails if requested configuration file does not exist', async () => {
    const res = await request
      .get('/conf/core/conf/invalid.json')
      .set('Authorization', 'valid');

    assert.strictEqual(res.status, 404);
    const error = res.body.error;
    assert.isDefined(error);
    assert.strictEqual(error.message, 'Configuration file not found: core/conf/invalid.json');
  });

  it('serves the core configuration file', async () => {
    const res = await request
      .get('/conf/core/conf/core.json')
      .set('Authorization', 'valid');

    assert.strictEqual(res.status, 200);
    assert.deepEqual(res.text, expectedConf('core'));
  });

  it('serves the register configuration file', async () => {
    const res = await request
      .get('/conf/register/conf/register.json')
      .set('Authorization', 'valid');

    assert.strictEqual(res.status, 200);
    assert.deepEqual(res.text, expectedConf('register'));
  });

  function expectedConf(component: string) {
    const expectedConf = require(`../fixtures/configs/${component}/conf/expected.json`);
    return JSON.stringify(expectedConf, 'utf8', 2);
  }
});
