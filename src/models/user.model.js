// @flow

const Permissions = require("./permissions.model").Permissions;

export interface User {
    username: string;
    password: string;
    permissions: Permissions
}