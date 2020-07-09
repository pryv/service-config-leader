// @flow

type Access = "read" | "write";

export interface Permission {
    configSection: string,
    permission: Access
}