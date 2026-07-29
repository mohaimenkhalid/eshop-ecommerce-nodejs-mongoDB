const Joi = require("joi");

exports.createCategorySchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required()
        .messages({
            "string.base": "Category name must be a string",
            "string.empty": "Category name is required",
            "string.min": "Category name must be at least 2 characters",
            "string.max": "Category name cannot exceed 50 characters",
            "any.required": "Category name is required",
        }),

    parentCategory: Joi.string()
        .hex()
        .length(24)
        .empty("")
        .optional()
        .messages({
            "string.base": "Parent category must be a valid ID string",
            "string.hex": "Parent category must be a valid hex ID",
            "string.length": "Parent category ID must be exactly 24 characters long",
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

exports.updateCategorySchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .messages({
            "string.base": "Category name must be a string",
            "string.empty": "Category name cannot be empty",
            "string.min": "Category name must be at least 2 characters",
            "string.max": "Category name cannot exceed 50 characters",
        }),

    parentCategory: Joi.string()
        .hex()
        .length(24)
        .empty("")
        .allow(null)
        .messages({
            "string.base": "Parent category must be a valid ID string",
            "string.hex": "Parent category must be a valid hex ID",
            "string.length": "Parent category ID must be exactly 24 characters long",
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
