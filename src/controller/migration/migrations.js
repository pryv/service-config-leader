// @flow

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

export type Migration = {
  versionsFrom: Array<string>,
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
    versionsFrom: ['1.0.34'], versionTo: '1.6.0',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.0'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/single-node/1.6.0-template.yml'), 'utf-8')),
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.0'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/cluster/1.6.0-template.yml'), 'utf-8')),
    },
  },
  {
    versionsFrom: ['1.6.0', '1.6.1', '1.6.2', '1.6.3'], versionTo: '1.6.4',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.4'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/single-node/1.6.4-template.yml'), 'utf-8')),
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.4'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/cluster/1.6.4-template.yml'), 'utf-8')),
    },
  },
  {
    versionsFrom: ['1.6.4', '1.6.5', '1.6.6', '1.6.7', '1.6.8', '1.6.9', '1.6.10', '1.6.11'], versionTo: '1.6.12',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.12'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/single-node/1.6.12-template.yml'), 'utf-8')),
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.12'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/cluster/1.6.12-template.yml'), 'utf-8')),
    },
  },
  {
    versionsFrom: ['1.6.12', '1.6.13', '1.6.14'], versionTo: '1.6.15',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.15'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/single-node/1.6.15-template.yml'), 'utf-8')),
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.15'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/cluster/1.6.15-template.yml'), 'utf-8')),
    },
  },
  {
    versionsFrom: ['1.6.15', '1.6.16', '1.6.17', '1.6.18','1.6.19','1.6.20'], versionTo: '1.6.21',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.21'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/single-node/1.6.21-template.yml'), 'utf-8')),
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.21'),
      template: yaml.load(fs.readFileSync(path.resolve(__dirname, 'scriptsAndTemplates/cluster/1.6.21-template.yml'), 'utf-8')),
    },
  },
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
