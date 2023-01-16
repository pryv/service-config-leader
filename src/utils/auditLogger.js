const fs = require('fs');

let auditLogger = null;

/**
 * @param {string} filePath
 * @returns {AuditLogger}
 */
function getAuditLogger(filePath) {
  if (auditLogger == null) {
    auditLogger = new AuditLogger(filePath);
  }
  return auditLogger;
}

const DELETE_USER_ACTION = 'DELETE /platform-users/:username';
const MODIFY_USER_ACTION = 'MODIFY /platform-users/:username';

module.exports = {
  getAuditLogger,
  DELETE_USER_ACTION,
  MODIFY_USER_ACTION
};

class AuditLogger {
  /**
   * @type {string}
   */
  filePath;

  /**
   * @param {string} filePath
   */
  constructor(filePath) {
    this.filePath = filePath;
  }

  /**
   * @param {string} adminUser
   * @param {string} action
   * @param {string} platformUser
   * @returns {void}
   */
  appendToLogFile(adminUser, action, platformUser) {
    fs.appendFileSync(this.filePath, `${new Date()} admin:${adminUser} ${action} platformUser:${platformUser}\n`);
  }
}
