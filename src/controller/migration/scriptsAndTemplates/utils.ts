const _ = require('lodash');

const logger = require('../../../utils/logging').getLogger('migration-utils');

/**
 * Performs base migration work on copy of platform
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
    const templateVersion: string = template.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value;
    platform.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value = templateVersion;
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
    for (const [mainSettingKey, mainSettingValue] of Object.entries(template)) {
      platform[mainSettingKey].name = mainSettingValue.name;
      for (const [subSettingKey, subSettingValue] of Object.entries(mainSettingValue.settings)) {
        platform[mainSettingKey].settings[subSettingKey].description = subSettingValue.description;
        if (subSettingValue.optional != null) {
          platform[mainSettingKey].settings[subSettingKey].optional = subSettingValue.optional;
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
    for (const [mainSettingKey, mainSettingValue] of Object.entries(template)) {
      if (platform[mainSettingKey] == null) {
        platform[mainSettingKey] = mainSettingValue;
        logger.info(`added new root setting: ${mainSettingKey}`);
      } else {
        for (const [subSettingKey, subSettingValue] of Object.entries(mainSettingValue.settings)) {
          if (platform[mainSettingKey].settings[subSettingKey] == null) {
            platform[mainSettingKey].settings[subSettingKey] = subSettingValue;
            logger.info(`added new sub setting: ${subSettingKey}`);
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
  for (const [mainSettingKey, mainSettingValue] of Object.entries(platform)) {
    if (template[mainSettingKey] == null) {
      delete platform[mainSettingKey];
      logger.info(`removed root setting: ${mainSettingKey}`);
    } else {
      for (const subSettingKey of Object.keys(mainSettingValue.settings)) {
        if (template[mainSettingKey].settings[subSettingKey] == null) {
          delete platform[mainSettingKey].settings[subSettingKey];
          logger.info(`removed sub setting: ${subSettingKey}`);
        }
      }
    }
  }
  return platform;
}
module.exports.deleteRemovedSettings = deleteRemovedSettings;

/**
 * To use when the value retrieved from the platform config is:
 * - either a JSON object
 * - or a JavaScript object
 *
 * @param {*} fieldName
 * @param {*} jsonOrObject
 */
function getObjectOrParseJSON(fieldName, jsonOrObject): {} {
  try {
    const parsedObject = JSON.parse(jsonOrObject);
    return parsedObject;
  } catch (e) {
    if (e.message.includes('Unexpected token') && e.message.includes('in JSON at position')) {
      logger.info(`attempted to parse ${fieldName} which was in fact an object and did not require parsing`);
      return jsonOrObject;
    }
    throw e;
  }
}
module.exports.getObjectOrParseJSON = getObjectOrParseJSON;
