/**
 * @license
 * Copyright (C) Pryv https://pryv.com
 * This file is part of Pryv.io and released under BSD-Clause-3 License
 * Refer to LICENSE file
 */
const joi = require('@hapi/joi');

const userLoginSchema = joi.object().keys({
  username: joi.string().required(),
  password: joi.string().required()
});

const permissionsSchema = joi.object().keys({
  users: joi
    .array()
    .required()
    .items(
      joi
        .string()
        .valid('read', 'create', 'changePermissions', 'resetPassword', 'delete')
    ),
  settings: joi.array().required().items(joi.string().valid('read', 'update')),
  platformUsers: joi
    .array()
    .required()
    .items(joi.string().valid('read', 'modify', 'delete'))
});

const createUserSchema = joi.object().keys({
  username: joi.string().required(),
  password: joi.string().required(),
  permissions: permissionsSchema.required()
});

const updatePermissionsSchema = joi.object().keys({
  permissions: permissionsSchema.required()
});

const changePasswordSchema = joi.object().keys({
  oldPassword: joi.string().required(),
  newPassword: joi.string().required(),
  newPasswordCheck: joi.string().required()
});

module.exports = {
  userLoginSchema,
  permissionsSchema,
  createUserSchema,
  updatePermissionsSchema,
  changePasswordSchema
};
