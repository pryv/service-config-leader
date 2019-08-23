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
    assert.strictEqual(error.message, "Configuration folder not found for 'valid'.");
  });

  it('serves a full configuration', async () => {
    const machineKey = 'singlenode-machine-key';
    const machineRole = settings.get(`machines:${machineKey}`);

    const res = await request
      .get('/conf')
      .set('Authorization', machineKey);

    assert.strictEqual(res.status, 200);
    const fullConf = res.body;
    assert.deepEqual(fullConf['/core/conf/core.json'], expectedConf(machineRole, 'core'));
    assert.deepEqual(fullConf['/register/conf/register.json'], expectedConf(machineRole, 'register'));
  });

  function expectedConf(role: string, component: string) {
    const dataFolder = settings.get('pathToData');
    const expectedConf = require(`${dataFolder}/${role}/${component}/conf/expected.json`);
    return JSON.stringify(expectedConf, 'utf8', 2);
  }
});
