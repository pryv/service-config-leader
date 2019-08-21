// @flow

/*global describe, it */

const assert = require('chai').assert;
const Application = require('../../src/app');

describe('Application', function () {

  it('generates random secrets at startup, if needed', async () => {
    const app = new Application();

    const secrets = app.settings.get('platform:secrets');

    assert.strictEqual(secrets['SECRET_ONE'], '1234');
    assert.match(secrets['SECRET_TWO'], /^[a-z0-9]{32}$/); 
  });
});
