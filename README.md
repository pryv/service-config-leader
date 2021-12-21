# Service-config-leader

Service enabling centralized configuration of all Pryv.io components; paired with [service-config-follower](https://github.com/pryv/service-config-follower).

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


## Adding a new template

See the [steps to publish a new release](https://github.com/pryv/intranet/blob/master/Engineering/Codebase/Publishing%20a%20new%20release.md#in-config-leader) on the intranet.


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
