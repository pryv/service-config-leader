// @flow

const path = require('path');
const fs = require('fs');

export function applySubstitutions(
  template: string,
  settings: Object,
  platformSettingsVars: Object
): string {
  const platformVars = retrieveFlatSettings(platformSettingsVars);
  const internalVars = settings.get('internals');

  if (platformVars == null && internalVars == null) return template;

  let substitutions = Object.assign({}, internalVars, platformVars);

  const re = new RegExp(Object.keys(substitutions).join('|'), 'g');
  return replaceInString(template);

  function replaceInString(myString: string): string {
    return myString.replace(re, (match) => {
      let replacement = substitutions[match];
      if (isObjectWithValueProp(substitutions[match])) {
        replacement = substitutions[match].value;
      }
      if (typeof replacement !== 'string') {
        return replaceInString(JSON.stringify(replacement));
      }
      return replaceInString(replacement);
    });
  }

  function isObjectWithValueProp(obj) {
    return typeof obj === 'object' && Object.hasOwnProperty.call(obj, 'value');
  }

  function retrieveFlatSettings(obj: Object): Object {
    let settings = getAllGroupSettings(obj);
    settings = minifySettings(settings);
    return settings;
  }

  function getAllGroupSettings(groupedSettings: Object): Object {
    let settings = {};
    for (const group of Object.keys(groupedSettings)) {
      for (const setting of Object.keys(groupedSettings[group]['settings'])) {
        settings[setting] = groupedSettings[group]['settings'][setting];
      }
    }
    return settings;
  }

  function minifySettings(settings: Object): Object {
    for (const setting of Object.keys(settings)) {
      if (
        typeof settings[setting].value === 'object' &&
        settings[setting].value != null
      ) {
        settings[setting].value = removeLowerValueKeysFromSettings(
          settings[setting].value
        );
      }
    }
    return settings;
  }
  
  function removeLowerValueKeysFromSettings(settings: Object): Object {
    for (const setting of Object.keys(settings)) {
      if (
        Object.hasOwnProperty.call(settings[setting], 'value') &&
        typeof settings[setting].value === 'object' &&
        settings[setting].value != null
      ) {
        settings[setting].value = removeLowerValueKeysFromSettings(
          settings[setting].value
        );
      } else if (Object.hasOwnProperty.call(settings[setting], 'value')) {
        settings[setting] = settings[setting].value;
      }
    }
    return settings;
  }
}

export function listConfFiles(dir: string, files: Array<string>): void {
  fs.readdirSync(dir).forEach((file) => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      listConfFiles(fullPath, files);
    } else if(fullPath.split('/').pop().split('.').pop() === 'json') {
      files.push(fullPath);
    }
  });
}

export function isValidJSON(text: string) {
  try {
    JSON.parse(text);
  } catch (e) {
    return false;
  }
  return true;
}
