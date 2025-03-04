/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
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
