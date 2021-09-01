// @flow

const _ = require('lodash');
const { baseWork, deleteRemovedSettings } = require('../utils');

module.exports = (platform: {}, template: {}): {} => {
  let platformCopy: {} = baseWork(platform, template);

  const oldMfa = _.cloneDeep(platformCopy.vars.MFA_SETTINGS.settings.MFA_SMS_API_SETTINGS.value);
  platformCopy.vars.MFA_SETTINGS.settings.MFA_SMS_API_SETTINGS.value.endpoints = oldMfa.endpoints.value;
  platformCopy.vars.MFA_SETTINGS.settings.MFA_SMS_API_SETTINGS.value.auth = oldMfa.auth.value;

  const oldWebhooks = _.cloneDeep(platformCopy.vars.ADVANCED_API_SETTINGS.settings.WEBHOOKS_SETTINGS.value);
  platformCopy.vars.ADVANCED_API_SETTINGS.settings.WEBHOOKS_SETTINGS.value = {
    maxRetries: oldWebhooks.maxRetries.value,
    minIntervalMs: oldWebhooks.minIntervalMs.value,
    runsSize: oldWebhooks.runsSize.value,
  };

  const oldVersioning = _.cloneDeep(platformCopy.vars.ADVANCED_API_SETTINGS.settings.VERSIONING_SETTINGS.value);
  platformCopy.vars.ADVANCED_API_SETTINGS.settings.VERSIONING_SETTINGS.value.deletionMode = oldVersioning.deletionMode.value;
  platformCopy.vars.ADVANCED_API_SETTINGS.settings.VERSIONING_SETTINGS.value.forceKeepHistory = oldVersioning.forceKeepHistory.value;


  platformCopy = deleteRemovedSettings(platformCopy, template);
  return platformCopy;
};