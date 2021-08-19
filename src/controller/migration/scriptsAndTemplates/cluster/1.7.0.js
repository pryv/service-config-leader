// @flow

const _ = require('lodash');
const { baseWork, deleteRemovedSettings } = require('../utils');

module.exports = (platform: {}, template: {}): {} => {
  let platformCopy: {} = baseWork(platform, template);

  const old = JSON.parse(platformCopy.vars.ADVANCED_API_SETTINGS.settings.CUSTOM_SYSTEM_STREAMS.value);
  platformCopy.vars.ADVANCED_API_SETTINGS.settings.ACCOUNT_SYSTEM_STREAMS.value = JSON.stringify(old.account);

  const otherStreamsObject: {} = _.omit(old, ['account']);
  const otherStreams: Array<{}> = [];
  for (const [streamId, streamData] of Object.entries(otherStreamsObject)) {
    otherStreams.push(Object.assign({}, { id: streamId, name: streamId }, streamData));
  }
  platformCopy.vars.ADVANCED_API_SETTINGS.settings.OTHER_SYSTEM_STREAMS.value = JSON.stringify(otherStreams);
  
  platformCopy = deleteRemovedSettings(platformCopy, template);
  return platformCopy;
};