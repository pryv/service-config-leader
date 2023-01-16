const { baseWork, deleteRemovedSettings } = require('../utils');
module.exports = (platform, template) => {
  let platformCopy = baseWork(platform, template);
  platformCopy = deleteRemovedSettings(platformCopy, template);
  return platformCopy;
};
