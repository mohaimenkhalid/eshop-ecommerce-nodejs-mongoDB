const Joi = require("joi");

exports.addToCartSchema = Joi.object({
    product: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.base": "product must be a valid ID",
            "string.hex": "product must be a valid ID",
            "string.length": "product ID must be exactly 24 characters long",
            "any.required": "product is required",
        }),

    variantId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.base": "variantId must be a valid ID",
            "string.hex": "variantId must be a valid ID",
            "string.length": "variantId must be exactly 24 characters long",
            "any.required": "variantId is required",
        }),

    quantity: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            "number.base": "quantity must be a number",
            "number.integer": "quantity must be an integer",
            "number.min": "quantity must be at least 1",
        }),

}).options({
        allowUnknown: false,
    })
    .messages({
        "object.unknown": "{{#label}} is not allowed",
    });

exports.updateCartSchema = Joi.object({
    quantity: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            "number.base": "quantity must be a number",
            "number.integer": "quantity must be an integer",
            "number.min": "quantity must be at least 1",
            "any.required": "quantity is required",
        }),

}).options({
        allowUnknown: false,
    })
    .messages({
        "object.unknown": "{{#label}} is not allowed",
    });
