// @flow

const path = require('path');
const fs = require('fs');

export function applySubstitutions(
  template: string,
  settings: Object,
  platformSettingsVars: Object,
): string {
  const platformVars = retrieveFlatSettings(platformSettingsVars);
  const internalVars = settings.get('internals');

  if (platformVars == null && internalVars == null) return template;

  const substitutions = { ...internalVars, ...platformVars };

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
    return obj != null && obj.value != null;
  }

  function retrieveFlatSettings(rootSettings: Object): Object {
    const settings = {};
    for (const group of Object.keys(rootSettings)) {
      for (const setting of Object.keys(rootSettings[group].settings)) {
        settings[setting] = rootSettings[group].settings[setting].value;
      }
    }
    return settings;
  }
}

export function listConfFiles(dir: string, files: Array<string>): void {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      listConfFiles(fullPath, files);
    } else {
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

export function isJSONFile(file: string): boolean {
  return file.split('/').pop().split('.').pop() === 'json';
}
