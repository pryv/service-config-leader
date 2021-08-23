// @flow

// eslint-disable-next-line no-unused-vars
const regeneratorRuntime = require('regenerator-runtime');

import simpleGit from "simple-git";

let git = null
function setupGit(settings): void {
  git = new Git(settings);
  return getGit();
}
module.exports.setupGit = setupGit;

function getGit() {
  if (git == null) throw new Error('git not setup, please call setupGit() before fetching singleton.');
  return git;
}
module.exports.getGit = getGit;

class Git {

  git: {};

  constructor(params: {}) {
    this.git = new simpleGit(params);
  }

  async initRepo() {
    return await this.git.init();
  }

  async commitChanges(message: string = 'update') {
    await this.git.add('.');
    await this.git.commit(message);
  }
}