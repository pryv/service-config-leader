const { baseWork, deleteRemovedSettings } = require('../utils');

module.exports = (platform: {}, template: {}): {} => {
  let platformCopy: {} = baseWork(platform, template);

  const old = platformCopy.MFA_SETTINGS.settings.MFA_SMS_API_SETTINGS.value;
  platformCopy.MFA_SETTINGS.settings.MFA_MODE.value = 'challenge-verify';
  platformCopy.MFA_SETTINGS.settings.MFA_ENDPOINTS.value.challenge.url = old.endpoints.challenge;
  platformCopy.MFA_SETTINGS.settings.MFA_ENDPOINTS.value.challenge.headers.authorization = old.auth;
  platformCopy.MFA_SETTINGS.settings.MFA_ENDPOINTS.value.verify.url = old.endpoints.verify;
  platformCopy.MFA_SETTINGS.settings.MFA_ENDPOINTS.value.verify.headers.authorization = old.auth;

  platformCopy = deleteRemovedSettings(platformCopy, template);
  return platformCopy;
};
