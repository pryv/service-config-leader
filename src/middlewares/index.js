// @flow

const errors = require('./errors');
const authorization = require('./authorization');
const cors = require('./cors');

module.exports = {
  errors: errors,
  authorization: authorization,
  cors: cors
};
