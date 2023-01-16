const { assert } = require('chai');
const path = require('path');
const { mkdirSync, statSync, writeFileSync } = require('fs');
const cuid = require('cuid');
const { tmpdir } = require('os');
const { setupGit, getGit } = require('@controller/migration/git');
const simpleGit = require('simple-git');

describe('git', () => {
  let git;
  let baseDir;
  let gitClient;
  before(() => {
    baseDir = path.resolve(tmpdir(), cuid());
    mkdirSync(baseDir);
    setupGit({ baseDir });
    git = getGit();
    gitClient = simpleGit({ baseDir });
  });

  describe('initRepo()', () => {
    it('must initiate a git repository', async () => {
      await git.initRepo();
      const stats = statSync(path.resolve(baseDir, '.git'));
      assert.isTrue(stats.isDirectory());
    });
  });

  describe('commitChanges()', () => {
    let text;
    let commitMsg;
    before(async () => {
      await git.initRepo();
      text = 'hello';
      commitMsg = 'howdy';
      writeFileSync(path.resolve(baseDir, 'someFile'), text);
    });

    it('must commit changes', async function () {
      if (process.env.IS_CI) {
        // for some reason, in CI, the "git commit" action can't figure out the author
        this.skip();
      }
      await git.commitChanges(commitMsg);
      const logs = await gitClient.log();
      assert.equal(logs.all.length, 1);
      assert.equal(logs.all[0].message, commitMsg);
      const { hash } = logs.all[0];
      const commit = await gitClient.show(hash);
      const lines = commit.split('\n');
      assert.include(lines[4], commitMsg);
      assert.include(lines[12], text);
    });
  });
});
