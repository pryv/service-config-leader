/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const { baseWork, deleteRemovedSettings } = require('../utils');
module.exports = (platform, template) => {
  let platformCopy = baseWork(platform, template);
  platformCopy = deleteRemovedSettings(platformCopy, template);
  return platformCopy;
};
