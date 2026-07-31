const Joi = require("joi");

const variantSchema = Joi.object({
    sku: Joi.string()
        .trim()
        .uppercase()
        .required()
        .messages({
            "string.empty": "SKU is required",
            "any.required": "SKU is required",
        }),

    color: Joi.string()
        .trim()
        .allow("")
        .optional(),

    size: Joi.string()
        .trim()
        .allow("")
        .optional(),

    price: Joi.number()
        .min(0)
        .required()
        .messages({
            "number.base": "Price must be a number",
            "number.min": "Price cannot be negative",
            "any.required": "Price is required",
        }),

    stock: Joi.number()
        .integer()
        .min(0)
        .required()
        .messages({
            "number.base": "Stock must be a number",
            "number.integer": "Stock must be an integer",
            "number.min": "Stock cannot be negative",
            "any.required": "Stock is required",
        }),

    images: Joi.array()
        .items(Joi.string())
        .default([]),
});


exports.createProductSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(150)
        .required()
        .messages({
            "string.base": "name must be a string",
            "string.empty": "name is required",
            "string.min": "name must be at least 3 characters",
            "string.max": "name cannot exceed 150 characters",
            "any.required": "name is required",
        }),

    description: Joi.string()
        .trim()
        .allow("")
        .optional()
    ,

    category: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.base": "category must be a valid ID",
            "string.hex": "category must be a valid ID",
            "string.length": "category ID must be exactly 24 characters long",
            "any.required": "category is required",
        }),
    brand: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.base": "brand must be a valid ID",
            "string.hex": "brand must be a valid ID",
            "string.length": "brand ID must be exactly 24 characters long",
            "any.required": "brand is required",
        }),

    isFeatured: Joi.boolean()
        .empty("")
        .optional()
        .messages({
            "boolean.base": "isFeatured must be a boolean value",
        }),

    // status: Joi.string()
    //     .valid("ACTIVE", "INACTIVE")
    //     .empty("")
    //     .optional()
    //     .messages({
    //         "string.base": "status must be a string",
    //         "any.only": "status must be either ACTIVE or INACTIVE",
    //     }),
    // variants: Joi.array()
    //     .items(variantSchema)
    //     .min(1)
    //     .required()
    //     .messages({
    //         "array.base": "Variants must be an array",
    //         "array.min": "At least one variant is required",
    //         "any.required": "Variants are required",
    //     })

}).options({
        allowUnknown: false,
    })
    .messages({
        "object.unknown": "{{#label}} is not allowed",
    });