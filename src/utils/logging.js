// @flow

const winston = require('winston');
const settings = require('../settings');

// Setup logging levels (match logging methods below)
const levels = Object.freeze({
  debug: 3,
  info: 2,
  warn: 1,
  error: 0
});
winston.setLevels(levels);
winston.addColors({
  debug: 'blue',
  info: 'green',
  warn: 'yellow',
  error: 'red'
});

// Spply settings
const logsSettings = settings.get('logs');

// (Console transport is present by default)
let consoleSettings = winston['default'].transports.console;
consoleSettings.silent = ! logsSettings.console.active;
if (logsSettings.console.active) {
  consoleSettings.level = logsSettings.console.level;
  consoleSettings.colorize = logsSettings.console.colorize;
  consoleSettings.timestamp = logsSettings.console.timestamp || true;
}
if (winston['default'].transports.file) {
  // In production env it seems winston already includes a file transport...
  winston.remove(winston.transports.File);
}
if (logsSettings.file.active) {
  winston.add(winston.transports.File, {
    level: logsSettings.file.level,
    filename: logsSettings.file.path,
    maxsize: logsSettings.file.maxFileBytes,
    maxFiles: logsSettings.file.maxNbFiles,
    timestamp: true,
    json: false
  });
}

const loggers: Map<string, Logger> = new Map();
const prefix = logsSettings.prefix;

// Returns a logger singleton for the given component. Keeps track of initialized
// loggers to only use one logger per component name.
//
module.exports.getLogger = function (componentName: string): Logger {
  const context = prefix + ':' + componentName;
  
  // Return memoized instance if we have produced it before.
  const existingLogger = loggers.get(context);
  if (existingLogger) return existingLogger;
  
  // Construct a new instance. We're passing winston as a logger here. 
  const logger = new LoggerImpl(context, winston);
  loggers.set(context, logger);
  
  return logger; 
};

interface Logger {
  debug(msg: string, metaData?: {}): void; 
  info(msg: string, metaData?: {}): void;
  warn(msg: string, metaData?: {}): void; 
  error(msg: string, metaData?: {}): void; 
}

class LoggerImpl implements Logger {
  messagePrefix: string; 
  winstonLogger: any; 
  
  // Creates a new logger for the given component.
  constructor(context?: string, winstonLogger) {
    this.messagePrefix = context ? '[' + context + '] ' : '';
    this.winstonLogger = winstonLogger;
  }
  
  debug(msg: string, metaData?: {}) {
    this.log('debug', msg, metaData);
  }
  info(msg: string, metaData?: {}) {
    this.log('info', msg, metaData);
  }
  warn(msg: string, metaData?: {}) {
    this.log('warn', msg, metaData);
  }
  error(msg: string, metaData?: {}) {
    this.log('error', msg, metaData);
  }
  
  log(level: string, message: string, metaData?: {}) {
    const msg = this.messagePrefix + message;
    const meta = metaData ? JSON.stringify(metaData) : {};
    
    this.winstonLogger[level](msg, meta);
  }
}
