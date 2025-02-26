/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const errors = require('./errors');
const authorization = require('./authorization');
const cors = require('./cors');

module.exports = {
  errors,
  authorization,
  cors
};
