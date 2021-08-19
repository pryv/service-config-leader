// @flow

module.exports = (platform: {}, template: {}): {} => {
  platform.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.version = '1.6.23';
  platform.vars.MACHINES_AND_PLATFORM_SETTINGS.settings.SINGLE_MACHINE_PUBLIC_INTERFACE_IP_ADDRESS = template.vars.MACHINES_AND_PLATFORM_SETTINGS.settings.SINGLE_MACHINE_PUBLIC_INTERFACE_IP_ADDRESS;
  return platform;
};