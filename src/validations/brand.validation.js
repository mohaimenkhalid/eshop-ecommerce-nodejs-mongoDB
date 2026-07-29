const Joi = require("joi");

exports.createBrandSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required()
        .messages({
            "string.base": "Brand name must be a string",
            "string.empty": "Brand name is required",
            "string.min": "Brand name must be at least 2 characters",
            "string.max": "Brand name cannot exceed 50 characters",
            "any.required": "Brand name is required",
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


exports.updateBrandSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .messages({
            "string.base": "Brand name must be a string",
            "string.empty": "Brand name cannot be empty",
            "string.min": "Brand name must be at least 2 characters",
            "string.max": "Brand name cannot exceed 50 characters",
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