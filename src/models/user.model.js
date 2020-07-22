import { updateLocale } from 'moment';

// @flow

const Permissions = require('./permissions.model').Permissions;

export class User {
    username: string;
    password: string;
    permissions: Permissions
    repository: any

    constructor(params: {
        username: string,
        password: string,
        permissions?: Permissions,
        repository: Repository,
    }) {
        
    }

    save(): void { // or number of rows

    }

    update(): void { // or number of rows

    }

    delete(): void { // or number of rows

    }

    isPasswordValid(): boolean {
        return this.repository.checkPassword(this);
    }

    isAllowedTo(testedPermissions: Permissions): boolean {
        // check if this.permissions are bigger than testedPermissions
    }
}