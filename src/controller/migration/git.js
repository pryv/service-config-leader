/**
 * @license
 * Copyright (C) 2019–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
const SimpleGit = require('simple-git');

let git = null;
/**
 * @returns {{}}
 */
function setupGit (settings) {
  git = new Git(settings);
  return getGit();
}
module.exports.setupGit = setupGit;

/**
 * @returns {any}
 */
function getGit () {
  if (git == null) throw new Error('git not setup, please call setupGit() before fetching singleton.');
  return git;
}
module.exports.getGit = getGit;

class Git {
  /**
   * @type {object}
   */
  git;

  /**
   * @param {object} params
   */
  constructor (params) {
    this.git = new SimpleGit(params);
    this.git.addConfig('user.name', 'Pryv config');
    this.git.addConfig('user.email', 'support@pryv.com');
  }

  /**
   * @returns {Promise<void>}
   */
  async initRepo () {
    return this.git.init();
  }

  /**
   * @param {string} message
   * @returns {Promise<void>}
   */
  async commitChanges (message = 'update') {
    await this.git.add('.');
    await this.git.commit(message);
  }
}
