const joi = require('@hapi/joi');

export const userLoginSchema =
  joi.object().keys({
    username: joi.string().required(),
    password: joi.string().required(),
  });

export const createUserSchema =
  joi.object().keys({
    username: joi.string().required(),
    password: joi.string().required(),
    permissions: joi.object().required()
  });

export const updatePermissionsSchema =
  joi.object().keys({
    permissions: joi.object().required()
  });

export const changePasswordSchema =
  joi.object().keys({
    password: joi.string().required()
  });