/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
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
