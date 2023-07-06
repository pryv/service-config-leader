/**
 * @license
 * Copyright (C) 2019–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const { baseWork, deleteRemovedSettings } = require('../utils');
module.exports = (platform, template) => {
  let platformCopy = baseWork(platform, template);
  platformCopy.ADVANCED_API_SETTINGS.settings.SSL_CAA_ISSUERS =
    [{ issuer: platformCopy.ADVANCED_API_SETTINGS.settings.SSL_CAA_ISSUER }];
  platformCopy = deleteRemovedSettings(platformCopy, template);
  return platformCopy;
};
