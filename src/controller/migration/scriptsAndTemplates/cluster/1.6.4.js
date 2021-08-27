// @flow

const _ = require('lodash');
const { baseWork, deleteRemovedSettings } = require('../utils');

module.exports = (platform: {}, template: {}): {} => {
  let platformCopy: {} = baseWork(platform, template);

  const old = _.cloneDeep(platformCopy.vars.MFA_SETTINGS.settings.MFA_SMS_API_SETTINGS.value);
  platformCopy.vars.MFA_SETTINGS.settings.MFA_SMS_API_SETTINGS.value.endpoints = old.endpoints.value;

  platformCopy = deleteRemovedSettings(platformCopy, template);
  return platformCopy;
};