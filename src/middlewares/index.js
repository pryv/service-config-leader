/**
 * @license
 * Copyright (C) 2019–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const errors = require('./errors');
const authorization = require('./authorization');
const cors = require('./cors');

module.exports = {
  errors,
  authorization,
  cors
};
