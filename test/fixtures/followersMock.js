// @flow

const nock = require('nock');
const settings = require('../../src/settings').getConfig();
const helper = require('./followersMockHelper');

module.exports.server = () => {
  const followers = settings.get('followers');
  for (const [auth, follower] of Object.entries(followers)) {
    nock(follower.url)
      .post('/notify', body => { 
        return helper.spy(body.services);
      })
      .reply(function () {
        const headerValue = this.req.headers.authorization;
        let status, result;
        if (auth === 'failing') {
          status = 500;
          result = 'Error';
        } else if (headerValue === auth) {
          status = 200;
          result = 'OK';
        } else {
          status = 403;
          result = 'Unauthorized.';
        }
        return [status, result]
      });
  }
}