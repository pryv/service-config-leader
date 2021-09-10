// @flow

const path = require('path');
const fs = require('fs');
const logger = require('./logging').getLogger('conf-utils');

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

/**
 * Accumulates all files found in dir and its children into files
 *
 * @param {*} dir the source directory
 * @param {*} files the array where (full) file names will be stored.
 */
export function listConfFiles(dir: string, files: Array<string>, seen: Map<string, string>): void {
  /**
   * Map: fullPath (without extension) -> fullpath
   */
  if (seen == null) seen = new Map();

  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    const fullPathWithoutExtension = path.parse(fullPath).name;
    if (fs.lstatSync(fullPath).isDirectory()) {
      listConfFiles(fullPath, files, seen);
    } else {
      /**
       * 1. new -> push
       * 2. seen with json -> remove and push
       * 3. seen with other -> do nothing
       */
      if (seen[fullPathWithoutExtension] != null && ! seen[fullPathWithoutExtension].endsWith('.json') && fullPath.endsWith('.json')) {
        return;
      }
      if (seen[fullPathWithoutExtension] != null && seen[fullPathWithoutExtension].endsWith('.json')) {
        files = remove(seen[fullPathWithoutExtension], files);
      }
      seen[fullPathWithoutExtension] = fullPath;
      files.push(fullPath);
    }
  });

  /**
   * removes the filname from the files array, and returns the modified array
   *
   * @param {*} filename the filename to remove
   * @param {*} files
   */
  function remove(filename: string, files: Array<string>): Array<string> {
    const index = files.indexOf(filename);
    if (index > -1) files.splice(index, 1);
    return files;
  }
}

export function isValidJSON(text: string) {
  try {
    JSON.parse(text);
  } catch (e) {
    logger.error(e);
    return false;
  }
  return true;
}

export function isJSONFile(file: string): boolean {
  return path.extname(file) === '.json';
}
