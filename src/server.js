/**
 * @license
 * Copyright (C) 2019–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
require('module-alias/register');

const Application = require('./app');
const logger = require('./utils/logging').getLogger('server');

(async () => {
  // Launch the app and server
  const app = new Application();
  await app.init(); // init git repo
  const { settings } = app;
  const port = settings.get('http:port');
  const ip = settings.get('http:ip');

  app.express.listen(port, ip, () => {
    logger.info(`Server running on: ${ip}:${port}`);
  });

  process.on('exit', () => app.disconnectFromDb());
  process.on('SIGHUP', () => process.exit());
  process.on('SIGINT', () => process.exit());
  process.on('SIGTERM', () => process.exit());
})();
