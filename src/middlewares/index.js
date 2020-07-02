// @flow

const errors = require('./errors');
const authorization = require('./authorization');
const authorizationAdmin = require('./authorizationAdmin');
const cors = require('./cors');

module.exports = {
  errors: errors,
  authorization: authorization,
  authorizationAdmin: authorizationAdmin,
  cors: cors
};
