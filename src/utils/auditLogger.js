// @flow

const fs = require('fs');

let auditLogger = null;


function getAuditLogger(filePath: string): AuditLogger {
  if (auditLogger == null) {
    auditLogger = new AuditLogger(filePath);
  }
  return auditLogger;
}

const DELETE_USER_ACTION = 'DELETE /platform-users/:username';

module.exports = { getAuditLogger, DELETE_USER_ACTION };

class AuditLogger {

  filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  appendToLogFile(adminUser: string, action: string, platformUser: string): void {
    fs.appendFileSync(this.filePath, `${new Date()} admin:${adminUser} ${action} platformUser:${platformUser}\n`)
  }
  
}