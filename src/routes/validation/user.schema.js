/**
 * @license
 * Copyright (C) 2019–2023 Pryv S.A. https://pryv.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
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
