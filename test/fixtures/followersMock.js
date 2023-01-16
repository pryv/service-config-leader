/**
 * @license
 * Copyright (C) 2019–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const nock = require('nock');
const settings = require('@root/settings').getSettings();
const helper = require('./followersMockHelper');
module.exports.server = () => {
  const followers = settings.get('followers');
  for (const [auth, follower] of Object.entries(followers)) {
    nock(follower.url)
      .post('/notify', (body) => helper.spy(body.services))
      .reply(function () {
        const headerValue = this.req.headers.authorization;
        let status;
        let result;
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
        return [status, result];
      });
  }
};
