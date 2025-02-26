/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const fs = require('fs');

before((done) => {
  fs.copyFileSync('dev-config.json', 'dev-config-copy.json');
  fs.copyFileSync('platform.yml', 'platform-copy.yml');
  done();
});

after((done) => {
  fs.renameSync('dev-config-copy.json', 'dev-config.json');
  fs.renameSync('platform-copy.yml', 'platform.yml');
  done();
});
