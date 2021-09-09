// @flow

const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs/promises');
const { getGit } = require('@controller/migration');

module.exports = function getPlatformSettings(mainSettings: {}): {} {
  return new PlatformSettings(mainSettings.get('platformSettings:platformConfig'));
};

const DEFAULT_PATH = path.resolve(__dirname, '../platform.yml');

class PlatformSettings {
  path: string;

  vars: {};

  overrides: {};

  constructor(path: string = DEFAULT_PATH) {
    this.path = path;
  }

  get(): {} {
    return this.vars;
  }

  setOverrides(overrides: {}): void {
    this.overrides = overrides;
  }

  async load(): Promise<{}> {
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
   * @param {*} platformSettings
   * @param {*} author
   */
  async save(newSettings: {}, gitCommitMsg: string): Promise<void> {
    this.vars = newSettings;
    await fs.writeFile(this.path, yaml.dump({ vars: this.vars }));
    const git: {} = getGit();
    await git.commitChanges(gitCommitMsg);
  }
}
