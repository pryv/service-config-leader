// @flow

import simpleGit from 'simple-git';

let git = null
function setupGit(settings): {} {
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
  author: string;

  constructor(params: {}) {
    this.git = new simpleGit(params);
    this.author = 'Pryv config <support@pryv.com>';
  }

  async initRepo() {
    return await this.git.init();
  }

  async commitChanges(message: string = 'update') {
    await this.git.add('.');
    await this.git.commit(message, { '--author': this.author });
  }
}