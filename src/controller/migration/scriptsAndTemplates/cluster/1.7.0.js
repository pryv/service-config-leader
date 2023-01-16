const { cloneAndApply } = require('@utils/treeUtils');
const {
  baseWork,
  deleteRemovedSettings,
  getObjectOrParseJSON
} = require('../utils');
module.exports = (platform, template) => {
  let platformCopy = baseWork(platform, template);
  let old = getObjectOrParseJSON(
    'platformCopy.ADVANCED_API_SETTINGS.settings.CUSTOM_SYSTEM_STREAMS.value',
    platformCopy.ADVANCED_API_SETTINGS.settings.CUSTOM_SYSTEM_STREAMS.value
  );
  old = convertRootKeysToStreams(old);
  old = cloneAndApply(old, (s) => {
    if (s.isShown == null) s.isShown = false;
    if (s.isEditable == null) s.isEditable = false;
    return s;
  });
  const indexOfAccount = old.findIndex((s) => s.id === 'account');
  const account = old[indexOfAccount];
  platformCopy.ADVANCED_API_SETTINGS.settings.ACCOUNT_SYSTEM_STREAMS.value = JSON.stringify(
    account.children
  );
  old.splice(indexOfAccount);
  platformCopy.ADVANCED_API_SETTINGS.settings.OTHER_SYSTEM_STREAMS.value = JSON.stringify(
    old
  );
  platformCopy = deleteRemovedSettings(platformCopy, template);
  return platformCopy;
};
/** @returns {{}[]} */
function convertRootKeysToStreams(oldAccountStreamsObject) {
  const streamsArray = [];
  for (const [streamId, children] of Object.entries(oldAccountStreamsObject)) {
    streamsArray.push({
      id: streamId,
      name: streamId,
      children,
      type: 'pryv/plain',
      isUnique: false,
      isIndexed: false,
      isEditable: false,
      isRequiredInValidation: false,
      isShown: false
    });
  }
  return streamsArray;
}
