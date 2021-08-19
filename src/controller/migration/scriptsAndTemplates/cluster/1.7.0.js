// @flow

const _ = require('lodash');

module.exports = (platform: {}, template: {}): {} => {
  platform.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.version = '1.7.0';
  platform.vars.ADVANCED_API_SETTINGS.settings.BACKWARD_COMPATIBILITY_SYSTEM_STREAMS_PREFIX = template.vars.ADVANCED_API_SETTINGS.settings.BACKWARD_COMPATIBILITY_SYSTEM_STREAMS_PREFIX
  const old = JSON.parse(platform.vars.ADVANCED_API_SETTINGS.settings.CUSTOM_SYSTEM_STREAMS.value);
  platform.vars.ADVANCED_API_SETTINGS.settings.ACCOUNT_SYSTEM_STREAMS = {
    value: JSON.stringify(old.account),
    description: template.vars.ADVANCED_API_SETTINGS.settings.ACCOUNT_SYSTEM_STREAMS.description,
  };
  platform.vars.ADVANCED_API_SETTINGS.settings.OTHER_SYSTEM_STREAMS = {
    value: JSON.stringify(_.omit(old, ['account'])),
    description: template.vars.ADVANCED_API_SETTINGS.settings.OTHER_SYSTEM_STREAMS.description,
  };
  platform.vars.AUDIT_SETTINGS = template.vars.AUDIT_SETTINGS;
  return platform;
};