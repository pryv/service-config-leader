// @flow

const nock = require('nock');
const settings = require('../../src/settings');

module.exports = function (): void {
  const followers = settings.get('followers');

  for (const [auth, follower] of Object.entries(followers)) {
    nock(follower.url)
      .post('/restart')
      .reply(function () {
        const headerValue = this.req.headers.authorization;
        let status, result;
        if (headerValue === auth) {
          status = 200;
          result = 'OK';
        }
        else {
          status = 403;
          result = 'Unauthorized.';
        }
        return [status, result];
      });
  }
};
