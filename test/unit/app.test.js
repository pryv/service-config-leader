// @flow

/*global describe, it */

const regeneratorRuntime = require("regenerator-runtime");

const assert = require('chai').assert;
const Application = require('@root/app');

describe('Application', function () {

  it('generates random secrets at startup, if needed', async () => {
    const app = new Application();
    const internals = app.settings.get('internals');

    assert.strictEqual(internals['SECRET_ONE'], '1234');
    assert.match(internals['SECRET_TWO'], /^[a-z0-9]{32}$/);
  });
});
