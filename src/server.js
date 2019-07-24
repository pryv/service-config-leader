// @flow

const settings = require('./settings');
const app = require('./app');
const logging = require('./utils/logging');
const logger = logging.getLogger('server');

// Launch the app server
const port = settings.get('http:port');
const ip = settings.get('http:ip');
app.listen(port, ip, () => {
  logger.info(`Server running on: ${ip}:${port}`);
});
