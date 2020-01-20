// @flow

/*global before, after */

const fs = require('fs');

before(done => {
  fs.copyFileSync('dev-config.json', 'dev-config-copy.json', 0);
  fs.copyFileSync('platform.json', 'platform-copy.json', 0);
  done();
});

after(done => {
  fs.renameSync('dev-config-copy.json', 'dev-config.json');
  fs.renameSync('platform-copy.json', 'platform.json');
  done();
});
