// @flow

import SimpleGit from 'simple-git';

let git = null;
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
    this.git = new SimpleGit(params);
    this.author = 'Pryv config <support@pryv.com>';
  }

  async initRepo(): Promise<void> {
    return this.git.init();
  }

  async commitChanges(message: string = 'update'): Promise<void> {
    await this.git.add('.');
    await this.git.commit(message, { '--author': this.author });
  }
}
