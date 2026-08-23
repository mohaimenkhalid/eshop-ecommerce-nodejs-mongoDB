const Joi = require("joi");

exports.createShopSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.base": "Shop name must be a string",
            "string.empty": "Shop name is required",
            "string.min": "Shop name must be at least 2 characters",
            "string.max": "Shop name cannot exceed 100 characters",
            "any.required": "Shop name is required",
        }),

    description: Joi.string()
        .trim()
        .max(1000)
        .empty("")
        .optional()
        .messages({
            "string.base": "Description must be a string",
            "string.max": "Description cannot exceed 1000 characters",
        }),

    phone: Joi.string()
        .trim()
        .pattern(/^[0-9+\-\s]{6,20}$/)
        .required()
        .messages({
            "string.base": "Phone must be a string",
            "string.empty": "Phone is required",
            "string.pattern.base": "Phone must be a valid phone number",
            "any.required": "Phone is required",
        }),

    email: Joi.string()
        .trim()
        .lowercase()
        .email({ tlds: { allow: false } })
        .empty("")
        .optional()
        .messages({
            "string.base": "Email must be a string",
            "string.email": "Email must be a valid email address",
        }),

    isFeatured: Joi.boolean()
        .empty("")
        .optional()
        .messages({
            "boolean.base": "isFeatured must be a boolean value",
        }),

    status: Joi.string()
        .valid("ACTIVE", "INACTIVE")
        .empty("")
        .optional()
        .messages({
            "string.base": "Status must be a string",
            "any.only": "Status must be either ACTIVE or INACTIVE",
        }),
}).options({
        allowUnknown: false,
    })
    .messages({
        "object.unknown": "{{#label}} is not allowed",
    });

exports.updateShopSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .messages({
            "string.base": "Shop name must be a string",
            "string.empty": "Shop name cannot be empty",
            "string.min": "Shop name must be at least 2 characters",
            "string.max": "Shop name cannot exceed 100 characters",
        }),

    description: Joi.string()
        .trim()
        .max(1000)
        .allow(null, "")
        .messages({
            "string.base": "Description must be a string",
            "string.max": "Description cannot exceed 1000 characters",
        }),

    phone: Joi.string()
        .trim()
        .pattern(/^[0-9+\-\s]{6,20}$/)
        .messages({
            "string.base": "Phone must be a string",
            "string.empty": "Phone cannot be empty",
            "string.pattern.base": "Phone must be a valid phone number",
        }),

    email: Joi.string()
        .trim()
        .lowercase()
        .email({ tlds: { allow: false } })
        .allow(null, "")
        .messages({
            "string.base": "Email must be a string",
            "string.email": "Email must be a valid email address",
        }),

    isFeatured: Joi.boolean()
        .empty("")
        .messages({
            "boolean.base": "isFeatured must be a boolean value",
        }),

    status: Joi.string()
        .valid("ACTIVE", "INACTIVE")
        .empty("")
        .messages({
            "string.base": "Status must be a string",
            "any.only": "Status must be either ACTIVE or INACTIVE",
        }),
}).min(1)
    .messages({
        "object.min": "At least one field is required to update",
        "object.unknown": "{{#label}} is not allowed",
    })
    .options({
        allowUnknown: false,
    });
