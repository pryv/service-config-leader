/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
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
