## 1.0

### 1.2.22

- template 1.9.0

### 1.2.21

- template 1.8.1
### 1.2.20

- new password rules entries

### 1.2.19

- template 1.8.0

### 1.2.19

- template 1.8.0

### 1.2.18

- template 1.7.14

### 1.2.17

- template 1.7.13

### 1.2.16

- template 1.7.12

### 1.2.15

- template 1.7.11

### 1.2.14

- template 1.7.10

### 1.2.13

- template 1.7.8

### 1.2.12

- Fix deactivate MFA for singlenode - fixes network issues where requests cannot be made on public hostname from within same network
- template 1.7.7

### 1.2.11

- template 1.7.6

### 1.2.10

- template 1.7.5

### 1.2.7-9

- add instructions in readme on how to generate new template
- release new templates

### 1.2.5-6

In migration process, handle if a value is a JSON or not.

### 1.2.1-4

Update templates and adapt tests

### 1.2.0 (1.1.7)

add /admin/migrations routes to check and apply platform config migrations:

- including git-based versioning for modifications to platform.yml
- new scheme with active platform.yml and template
- settings and platformSettings refactoring
- update linter
- upgrade to node 16
- replace transpilation with the one from core, cleaning up garbage such as regenerator-runtime

### 1.1.4-5-6

- add Deactivate MFA route

### 1.1.3

- add account deletion option
- adapt to core deleting register

### 1.1

Fix API response format for coherence with core API.

### 1.0.26

Fix delete platform user for single-node setup

### 1.0.24-25

add initial_user credentials folder to config

### 1.0.23

Only support 1 level of platform settings (and group settings above).

### 1.0.21-22

rename config leader JSON web token secret in config

### 1.0.20

- Fix crash when embedded platform values are set to null

### 1.0.19

- Users delete

### 1.0.18

- reload platform.yml parameters at each GET /conf (instead of only template files)
- specify services to reboot on PUT /admin/settings route

### 1.0.3

- Simplify user-facing configuration and use yaml

### 1.0.2

- Update node version to 12.13.1.

### 1.0.1

- Differentiate 'platform' and 'internals' settings.

### 1.0.0

- Initial version.

## About earlier versions

Versions earlier than 1.0.0 are not covered here.
