// @flow

/*global describe, it */

const assert = require('chai').assert;
const Application = require('../../src/app');

describe('Application', function () {

  it('generates random secrets at startup, if needed', async () => {
    const app = new Application();
    const platformSettings = app.settings.get('platform');

    assert.strictEqual(platformSettings['SECRET_ONE'], '1234');
    assert.match(platformSettings['SECRET_TWO'], /^[a-z0-9]{32}$/);
  });
});
