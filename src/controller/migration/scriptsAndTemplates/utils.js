// @flow

const _ = require('lodash');

const logger = require('../../../utils/logging').getLogger('migration-utils');

/**
 * Performs base migration work
 * 
 * @param {*} platform content of platform.yml
 * @param {*} template content of template platform.yml
 */
function baseWork(platform: {}, template: {}): {} {
  let platformCopy: {} = _.cloneDeep(platform);
  platformCopy = updateTemplateVersion(platformCopy, template);
  platformCopy = addNewSettings(platformCopy, template);
  platformCopy = alignMetadata(platformCopy, template);
  return platformCopy;

  /**
   * Update the platform template version to the one of the template
   * 
   * @param {*} platform content of platform.yml
   * @param {*} template content of template platform.yml
   */
  function updateTemplateVersion(platform: {}, template: {}): {} {
    const templateVersion: string = template.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value
    platform.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value = templateVersion;
    logger.info(`updated template version to: ${templateVersion}`);
    return platform;
  }
  
  /**
   * sets all metedata to the ones of the template
   * 
   * @param {*} platform content of platform.yml
   * @param {*} template content of template platform.yml
   */
  function alignMetadata(platform: {}, template: {}): {} {
    for (const [mainSettingKey, mainSettingValue] of Object.entries(template.vars)) {
      platform.vars[mainSettingKey].name = mainSettingValue.name;
      for (const [subSettingKey, subSettingValue] of Object.entries(mainSettingValue.settings)) {
        platform.vars[mainSettingKey].settings[subSettingKey].description = subSettingValue.description;
        if (subSettingValue.optional != null) {
          platform.vars[mainSettingKey].settings[subSettingKey].optional = subSettingValue.optional;
        }
      }
    }
    logger.info('aligned metadata to template');
    return platform;
  }
  
  /**
   * Adds all new settings from the template
   * 
   * @param {*} platform content of platform.yml
   * @param {*} template content of template platform.yml
   */
  function addNewSettings(platform: {}, template: {}): {} {
  
    for (const [mainSettingKey, mainSettingValue] of Object.entries(template.vars)) {
  
      if (platform.vars[mainSettingKey] == null) {
        platform.vars[mainSettingKey] = mainSettingValue;
        logger.info(`added new root setting: ${mainSettingKey}`)
      } else {
        for (const [subSettingKey, subSettingValue] of Object.entries(mainSettingValue.settings)) {
          if (platform.vars[mainSettingKey].settings[subSettingKey] == null) {
            platform.vars[mainSettingKey].settings[subSettingKey] = subSettingValue;
            logger.info(`added new sub setting: ${subSettingKey}`)
          }
          
        }
      }
    }
    return platform;
  }
}
module.exports.baseWork = baseWork;

/**
 * Deletes from platform.yml settings that are gone from the template
 * This is a destructive
 * 
 * @param {*} platform 
 * @param {*} template 
 */
function deleteRemovedSettings(platform: {}, template: {}): {} {
  for (const [mainSettingKey, mainSettingValue] of Object.entries(platform.vars)) {
    if (template.vars[mainSettingKey] == null) {
      delete platform.vars[mainSettingKey];
      logger.info(`removed root setting: ${mainSettingKey}`);
    } else {
      for (const [subSettingKey, subSettingValue] of Object.entries(mainSettingValue.settings)) {
        if (template.vars[mainSettingKey].settings[subSettingKey] == null) {
          delete platform.vars[mainSettingKey].settings[subSettingKey];
          logger.info(`removed sub setting: ${subSettingKey}`);
        }
      }
    }
  }
  return platform;
}
module.exports.deleteRemovedSettings = deleteRemovedSettings;
