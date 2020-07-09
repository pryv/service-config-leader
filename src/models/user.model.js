// @flow

const Permission = require("./../models/permission.model").Permission;

export interface User {
    username: string;
    password: string;
    permissions: Permission[]
}