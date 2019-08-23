// @flow

/*global before, after */

const fs = require('fs');

before(done => {
  fs.copyFile('dev-config.json', 'dev-config-copy.json', done);
});

after(done => {
  fs.rename('dev-config-copy.json', 'dev-config.json', done);
});
