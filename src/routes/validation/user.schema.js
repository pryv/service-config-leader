const joi = require('@hapi/joi');

export const userLoginSchema = joi.object().keys({
  username: joi.string().required(),
  password: joi.string().required()
});

export const permissionsSchema = joi.object().keys({
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

export const createUserSchema = joi.object().keys({
  username: joi.string().required(),
  password: joi.string().required(),
  permissions: permissionsSchema.required()
});

export const updatePermissionsSchema = joi.object().keys({
  permissions: permissionsSchema.required()
});

export const changePasswordSchema = joi.object().keys({
  oldPassword: joi.string().required(),
  newPassword: joi.string().required(),
  newPasswordCheck: joi.string().required()
});
