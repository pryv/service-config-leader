/**
 * @license
 * Copyright (C) 2019–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs/promises');
const { getGit } = require('@controller/migration');

module.exports = function getPlatformSettings (mainSettings) {
  return new PlatformSettings(mainSettings.get('platformSettings:platformConfig'));
};

const DEFAULT_PATH = path.resolve(__dirname, '../platform.yml');

class PlatformSettings {
  /**
   * @type {string}
  */
  path;
  /**
   * @type {object}
   */
  vars;
  /**
   * @type {object}
   */
  overrides;

  /**
   * @param {object} path
   */
  constructor (path = DEFAULT_PATH) {
    this.path = path;
  }

  /**
   * @returns {object}
   */
  get () {
    return this.vars;
  }

  /**
   * @param {object} overrides
   * @returns {void}
   */
  setOverrides (overrides) {
    this.overrides = overrides;
  }

  /**
   * @returns {Promise<{}>}
   */
  async load () {
    const data = await fs.readFile(this.path);
    this.vars = await yaml.load(data).vars;
    if (this.overrides != null) {
      this.vars = Object.assign(this.vars, this.overrides.vars);
    }
    return this.vars;
  }

  /**
   * Writes the content of platform and versions it using git
   *
   * @param {object} newSettings
   * @param {string} gitCommitMsg
   * @returns {Promise<void>}
   */
  async save (newSettings, gitCommitMsg) {
    this.vars = newSettings;
    await fs.writeFile(this.path, yaml.dump({ vars: this.vars }));
    const git = getGit();
    await git.commitChanges(gitCommitMsg);
  }
}
