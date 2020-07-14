// @flow
require('module-alias/register')

const Application = require('./app');
const logger = require('./utils/logging').getLogger('server');

// Launch the app and server
const app = new Application();
const settings = app.settings;
const port = settings.get('http:port');
const ip = settings.get('http:ip');

app.express.listen(port, ip, () => {
  logger.info(`Server running on: ${ip}:${port}`);
});

process.on('exit', () => app.disconnectFromDb());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));