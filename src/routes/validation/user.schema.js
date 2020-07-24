const joi = require("@hapi/joi");

export const userLoginSchema = joi.object().keys({
  username: joi.string().required(),
  password: joi.string().required(),
});

export const permissionsSchema = joi.object().keys({
  users: joi
    .array()
    .required()
    .items(
      joi
        .string()
        .valid("read", "create", "changePermissions", "resetPassword", "delete")
    ),
  settings: joi.array().required().items(joi.string().valid("read", "update")),
});

export const createUserSchema = joi.object().keys({
  username: joi.string().required(),
  password: joi.string().required(),
  permissions: permissionsSchema.required(),
});

export const updatePermissionsSchema = joi.object().keys({
  permissions: permissionsSchema.required(),
});

export const changePasswordSchema = joi.object().keys({
  password: joi.string().required(),
});
