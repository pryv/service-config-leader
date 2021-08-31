// @flow

const { baseWork, deleteRemovedSettings } = require('../utils');

module.exports = (platform: {}, template: {}): {} => {
  let platformCopy: {} = baseWork(platform, template);

  const old = platformCopy.vars.MFA_SETTINGS.settings.MFA_SMS_API_SETTINGS.value;
  platformCopy.vars.MFA_SETTINGS.settings.MFA_MODE.value = 'challenge-verify';
  platformCopy.vars.MFA_SETTINGS.settings.MFA_ENDPOINTS.value.challenge.url = old.endpoints.challenge;
  platformCopy.vars.MFA_SETTINGS.settings.MFA_ENDPOINTS.value.challenge.headers.authorization = old.auth;
  platformCopy.vars.MFA_SETTINGS.settings.MFA_ENDPOINTS.value.verify.url = old.endpoints.verify;
  platformCopy.vars.MFA_SETTINGS.settings.MFA_ENDPOINTS.value.verify.headers.authorization = old.auth;

  platformCopy = deleteRemovedSettings(platformCopy, template);
  return platformCopy;
};
