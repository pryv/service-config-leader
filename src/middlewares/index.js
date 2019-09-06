// @flow

const errors = require('./errors');
const authorization = require('./authorization');
const authorizationAdmin = require('./authorizationAdmin');

module.exports = {
  errors: errors,
  authorization: authorization,
  authorizationAdmin: authorizationAdmin,
};
