# Service-configuration

A service for centralization of Pryv.io configuration and distribution among all Pryv.io components.

Prerequisites: Node v8+, Yarn v1+

## How to?

| Task                              | Command                        |
| --------------------------------- | ------------------------------ |
| Setup                             | `yarn install`                 |
| Run API server                    | `yarn start`                   |
| Run Tests                         | `yarn test`                    |
| Create Distribution               | `yarn release`                 |

## How it works

Takes variables from:
- platform.yml:vars
- config-leader.json:internals

and substitutes them in `config-leader.json:dataFolder`

You wish to:

### Replace a string (recursively or not)

*platform.yml or config-leader.json*
VAR_NAME: 'blablabla'
->
*.../${role}.json*
VAR_KEY: "VAR_NAME" (don't forget using quotes)

### Replace an object

*platform.yml or config-leader.json*
VAR_NAME: {...}
->
*.../${role}.json*
VAR_KEY: VAR_NAME