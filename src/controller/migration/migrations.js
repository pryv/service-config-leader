/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const migrations = addTemplateUpgradeToEmptyRuns([
  {
    versionsFrom: ['1.0.34'],
    versionTo: '1.6.0',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.0'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.6.0-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.0'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.6.0-template.yml')
    }
  },
  {
    versionsFrom: ['1.6.0', '1.6.1', '1.6.2', '1.6.3'],
    versionTo: '1.6.4',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.4'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.6.4-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.4'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.6.4-template.yml')
    }
  },
  {
    versionsFrom: [
      '1.6.4',
      '1.6.5',
      '1.6.6',
      '1.6.7',
      '1.6.8',
      '1.6.9',
      '1.6.10',
      '1.6.11'
    ],
    versionTo: '1.6.12',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.12'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.6.12-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.12'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.6.12-template.yml')
    }
  },
  {
    versionsFrom: ['1.6.12', '1.6.13', '1.6.14'],
    versionTo: '1.6.15',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.15'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.6.15-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.15'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.6.15-template.yml')
    }
  },
  {
    versionsFrom: ['1.6.15', '1.6.16', '1.6.17', '1.6.18', '1.6.19', '1.6.20'],
    versionTo: '1.6.21',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.21'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.6.21-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.21'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.6.21-template.yml')
    }
  },
  {
    versionsFrom: ['1.6.21'],
    versionTo: '1.6.22',
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.6.22'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.6.22-template.yml')
    }
  },
  {
    versionsFrom: ['1.6.22'],
    versionTo: '1.6.23',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.6.23'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.6.23-template.yml'
      )
    }
  },
  {
    versionsFrom: ['1.6.23'],
    versionTo: '1.7.0',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.0'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.0-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.0'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.0-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.0'],
    versionTo: '1.7.1',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.1'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.1-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.1'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.1-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.1', '1.7.2'],
    versionTo: '1.7.3',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.3'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.3-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.3'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.3-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.3'],
    versionTo: '1.7.4',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.4'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.4-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.4'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.4-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.4'],
    versionTo: '1.7.5',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.5'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.5-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.5'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.5-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.5'],
    versionTo: '1.7.6',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.6'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.6-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.6'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.6-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.6'],
    versionTo: '1.7.7',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.7'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.7-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.7'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.7-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.7'],
    versionTo: '1.7.8',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.8'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.8-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.8'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.8-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.8'],
    versionTo: '1.7.10',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.10'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.10-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.10'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.10-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.10'],
    versionTo: '1.7.11',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.11'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.11-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.11'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.11-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.11'],
    versionTo: '1.7.12',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.12'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.12-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.12'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.12-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.12'],
    versionTo: '1.7.13',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.13'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.13-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.13'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.13-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.13'],
    versionTo: '1.7.14',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.7.14'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.7.14-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.7.14'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.7.14-template.yml')
    }
  },
  {
    versionsFrom: ['1.7.14'],
    versionTo: '1.8.0',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.8.0'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.8.0-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.8.0'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.8.0-template.yml')
    }
  },
  {
    versionsFrom: ['1.8.0'],
    versionTo: '1.8.1',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.8.1'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.8.1-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.8.1'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.8.1-template.yml')
    }
  },
  {
    versionsFrom: ['1.8.1'],
    versionTo: '1.9.0',
    singlenode: {
      run: require('./scriptsAndTemplates/single-node/1.9.0'),
      template: loadTemplate(
        'scriptsAndTemplates/single-node/1.9.0-template.yml'
      )
    },
    cluster: {
      run: require('./scriptsAndTemplates/cluster/1.9.0'),
      template: loadTemplate('scriptsAndTemplates/cluster/1.9.0-template.yml')
    }
  }
]);

/**
 *
 * @param {Array<Migration>} migrations  undefined
 * @returns {import("/Users/sim/Code/Pryv/dev/service-config-leader/migrations.ts-to-jsdoc").Migration[]}
 */
function addTemplateUpgradeToEmptyRuns (migrations) {
  for (const migration of migrations) {
    if (migration.cluster == null) { migration.cluster = addRun(migration.versionTo); }
    if (migration.singlenode == null) { migration.singlenode = addRun(migration.versionTo); }
  }
  return migrations;
  function addRun (version) {
    return {
      run: (platform) => {
        platform.MISCELLANEOUS_SETTINGS.settings.TEMPLATE_VERSION.value = version;
        return platform;
      },
      template: {}
    };
  }
}

/**
 * Loads the template, returns .vars
 *
 * @param {string} filePath  the file path, relative to this directory
 * @returns {{}}
 */
function loadTemplate (filePath) {
  const template = yaml.load(
    fs.readFileSync(path.resolve(__dirname, filePath), 'utf-8')
  );
  return template.vars;
}
module.exports.migrations = migrations;

/**
 * @typedef {{
 *   versionsFrom: Array<string>
 *   versionTo: string
 *   cluster?: Run
 *   singlenode?: Run
 * }} Migration
 */

/**
 * @typedef {{
 *   run: (a: {}) => {}
 *   template: {}
 * }} Run
 */
