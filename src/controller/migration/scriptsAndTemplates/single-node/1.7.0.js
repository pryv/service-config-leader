// @flow

const _ = require('lodash');

module.exports = (platform: {}, template: {}): {} => {
  platform.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.version = '1.7.0';
  platform.vars.ADVANCED_API_SETTINGS.settings.BACKWARD_COMPATIBILITY_SYSTEM_STREAMS_PREFIX = {
    value: false,
    description: "Makes the API accept and return system streams with the old '.' (dot) prefix (ex.: '.account'). When activated, you can migrate applications " +
    "by making API calls with the 'disable-backward-compatibility-prefix: true' header. " +
    "Default value: false"
  }
  const old = JSON.parse(platform.vars.ADVANCED_API_SETTINGS.settings.CUSTOM_SYSTEM_STREAMS.value);

  platform.vars.ADVANCED_API_SETTINGS.settings.ACCOUNT_SYSTEM_STREAMS = {
    value: JSON.stringify(old.account),
    description:  "Custom account fields that are saved and validated during the registration. " + 
      "Preferably these values should be modified with care, because fields like isUnique or isIndexed would not be updated " +
      "after settings update. If you remove streams that have events in some user accounts, these events will become unreachable." +
      "Default value: [{'isIndexed': true,'isUnique': true,'isShown': true,'isEditable': true,'type': 'email/string', " +
      "'name': 'Email','id': 'email','isRequiredInValidation': true}]'." +
      "More information available here: https://api.pryv.com/customer-resources/system-streams/",
  };
  platform.vars.ADVANCED_API_SETTINGS.settings.OTHER_SYSTEM_STREAMS = {
    value: JSON.stringify(_.omit(old, ['account'])),
    description: "Custom stream structure that is available in all accounts. Preferably these values should be changed rarely. If you remove streams that " +
      "have events in some user accounts, these events will become unreachable. " +
      "Default value: [] " +
      "More information available here: https://api.pryv.com/customer-resources/system-streams/"
  };
  delete platform.vars.ADVANCED_API_SETTINGS.settings.CUSTOM_SYSTEM_STREAMS;

  platform.vars.AUDIT_SETTINGS = template.vars.AUDIT_SETTINGS;
  return platform;
};