// @flow

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

export type Migration = {
  versionsFrom: string,
  versionTo: string,
  cluster?: Run,
  singlenode?: Run,
}
export type Run = {
  run: ({}) => {},
  template: {},
}

//console.log('yo', fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/cluster/1.6.22.js'), 'utf-8'))

const migrations: Array<Migration> = addTemplateUpgradeToEmptyRuns([
  { 
    versionsFrom: ['1.6.21'], versionTo: '1.6.22',
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.22'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/cluster/1.6.22-template.yml'), 'utf-8')),
    }
  },
  { 
    versionsFrom: ['1.6.22'], versionTo: '1.6.23', 
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.23'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/single-node/1.6.23-template.yml'), 'utf-8')),
    },
  },
  { 
    versionsFrom: ['1.6.23'], versionTo: '1.7.0', 
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.0'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/single-node/1.7.0-template.yml'), 'utf-8')),
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.0'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/cluster/1.7.0-template.yml'), 'utf-8')),
    },
  },
]);

function addTemplateUpgradeToEmptyRuns(migrations: Array<Migration>): Array<Migration> {
  for(const migration of migrations) {
    if (migration.cluster == null) migration.cluster = addRun(migration.versionTo);
    if (migration.singlenode == null) migration.singlenode = addRun(migration.versionTo);
  }
  return migrations;

  function addRun(version: string): Run {
    return {
      run: (platform: {}) => {
        platform.vars.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value = version;
        return platform;
      },
      template: {},
    };
  }
}

module.exports.migrations = migrations;
