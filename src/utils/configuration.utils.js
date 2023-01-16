const path = require('path');
const fs = require('fs');
const logger = require('./logging').getLogger('conf-utils');

module.exports = {
  applySubstitutions,
  listConfFiles,
  isValidJSON,
  isJSONFile,
  isSingleNode,
  findCoresUrls
};

/**
 * @param {string} template
 * @param {any} settings
 * @param {any} platformSettingsVars
 * @returns {string}
 */
function applySubstitutions(template, settings, platformSettingsVars) {
  const platformVars = retrieveFlatSettings(platformSettingsVars);
  const internalVars = settings.get('internals');
  if (platformVars == null && internalVars == null) return template;
  const substitutions = { ...internalVars, ...platformVars };
  const re = new RegExp(Object.keys(substitutions).join('|'), 'g');
  return replaceInString(template);

  function replaceInString(myString) {
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

  function retrieveFlatSettings(rootSettings) {
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
 * @param {string} dir  the source directory
 * @param {Array<string>} files  the array where (full) file names will be stored.
 * @param {Map<string, string>} seen
 * @returns {void}
 */
function listConfFiles(dir, files, seen) {
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
      if (
        seen[fullPathWithoutExtension] != null &&
        !seen[fullPathWithoutExtension].endsWith('.json') &&
        fullPath.endsWith('.json')
      ) {
        return;
      }
      if (
        seen[fullPathWithoutExtension] != null &&
        seen[fullPathWithoutExtension].endsWith('.json')
      ) {
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
  function remove(filename, files) {
    const index = files.indexOf(filename);
    if (index > -1) files.splice(index, 1);
    return files;
  }
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function isValidJSON(text) {
  try {
    JSON.parse(text);
  } catch (e) {
    logger.error(e);
    return false;
  }
  return true;
}

/**
 * @param {string} file
 * @returns {boolean}
 */
function isJSONFile(file) {
  return path.extname(file) === '.json';
}

/**
 * @param {{}} followers
 * @returns {boolean}
 */
function isSingleNode(followers) {
  if (followers == null) {
    throw new Error('Missing followers settings');
  }
  const singleNodeFollowers = Object.entries(followers).filter(
    (follower) => follower[1].role === 'singlenode'
  );
  if (singleNodeFollowers.length === 1) {
    return true;
  }
  return false;
}

/**
 * @param {{}} followers
 * @returns {string[]}
 */
function findCoresUrls(followers) {
  if (followers == null) {
    throw new Error('Missing followers settings');
  }
  const coreUrls = Object.entries(followers)
    .filter((follower) => follower[1].role === 'core')
    .map((core) => core[1].url);
  if (coreUrls == null || coreUrls.length === 0) {
    throw new Error('No core machines defined in followers settings');
  }
  return coreUrls;
}
