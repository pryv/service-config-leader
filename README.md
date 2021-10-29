# Service-configuration

A service for centralization of Pryv.io configuration and distribution among all Pryv.io components.

Exposes HTTP REST API to retrieve and update platform configuration.
Exposes also HTTP REST API to manage users having access to the platform configuration API.

Prerequisites: Node v8+, Yarn v1+

## How to?

| Task                         | Command        |
| ---------------------------- | -------------- |
| Setup                        | `yarn install` |
| Run API server               | `yarn start`   |
| Run Tests                    | `yarn test`    |
| Run Tests with server logs   | `yarn test-log`|
| Create Distribution          | `yarn release` |
| Recompile During Development | `yarn watch`   |

## Add template

1. Create the following files (find inspiration from previous entries):
  If there is no difference between cluster and single-node, write the `.js` for cluster and put only `module.exports = require('../cluster/1.7.0');` in single-node.
1.1 `src/controller/migration/scriptsAndTemplates/cluster/${version}.js`
1.2 `src/controller/migration/scriptsAndTemplates/cluster/${version}-template.yml`
1.1 `src/controller/migration/scriptsAndTemplates/single-node/${version}.js`
1.2 `src/controller/migration/scriptsAndTemplates/single-node/${version}-template.yml`

2. Add links to the files you added in the `migrations` object in `src/controller/migration/migrations.js`

3. Run tests

4. Build new image

5. Update config-leader image version in config-template-pryv.io

## How it works

Takes variables from:

- platform.yml:vars
- config-leader.json:internals

and substitutes them in `config-leader.json:dataFolder`

You wish to:

### Replace a string (recursively or not)

_platform.yml or config-leader.json_
VAR*NAME: 'blablabla'
->
*.../\${role}.json\_
VAR_KEY: "VAR_NAME" (don't forget using quotes)

### Replace an object

_platform.yml or config-leader.json_
VAR*NAME: {...}
->
*.../\${role}.json\_
VAR_KEY: VAR_NAME

## Platform configuration with the API

### Users management

On the startup of the server, a user is created with all possible permissions.
Credentials of this user will be displayed in console upon it's creation.
Note that this user is recreated each time the server restarts.
Therefore it is not an admin user, but rather an initial user, that has sufficient permissions to create other users and should serve as an emergency user after having created first admin-like user.
