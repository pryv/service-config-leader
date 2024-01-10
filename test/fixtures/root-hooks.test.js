/**
 * @license
 * Copyright (C) 2019–2024 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
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
