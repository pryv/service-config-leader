// @flow

/*global describe, it*/

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');
const fs = require('fs');

const assert = require('chai').assert;
const Application = require('@root/app');

describe('Application', function () {

  it('generates random secrets at startup, if needed', () => {
    const app = new Application();
    const internals = app.settings.get('internals');

    assert.strictEqual(internals['SECRET_ONE'], '1234');
    assert.match(internals['SECRET_TWO'], /^[a-z0-9]{32}$/);
  });

  it('generates admin credentials at startup and writes it to credentials file and database', () => {
    const app = new Application();
    const credentialsPath = app.settings.get('credentials:filePath');

    const password = fs.readFileSync(credentialsPath, {encoding: 'utf-8'});
    
    const isPasswordValid = app.usersRepository.isPasswordValid({
      username: 'initial_user',
      password: password,
    });

    assert.isTrue(isPasswordValid);
  });
});
