const Joi = require("joi");

const shippingAddressSchema = Joi.object({
    receiverName: Joi.string()
        .trim()
        .required()
        .messages({
            "string.empty": "Receiver name is required",
            "any.required": "Receiver name is required",
        }),

    receiverPhone: Joi.string()
        .trim()
        .required()
        .messages({
            "string.empty": "Receiver phone number is required",
            "any.required": "Receiver phone number is required",
        }),

    addressLine: Joi.string()
        .trim()
        .required()
        .messages({
            "string.empty": "Address line is required",
            "any.required": "Address line is required",
        }),

    area: Joi.string()
        .trim()
        .required()
        .messages({
            "string.empty": "Area is required",
            "any.required": "Area is required",
        }),

    city: Joi.string()
        .trim()
        .required()
        .messages({
            "string.empty": "City is required",
            "any.required": "City is required",
        }),

    division: Joi.string()
        .trim()
        .required()
        .messages({
            "string.empty": "Division is required",
            "any.required": "Division is required",
        }),

    postalCode: Joi.string()
        .trim()
        .required()
        .messages({
            "string.empty": "Postal code is required",
            "any.required": "Postal code is required",
        }),

    country: Joi.string()
        .trim()
        .default("Bangladesh")
        .optional(),
});

exports.createOrderSchema = Joi.object({
    shippingAddress: shippingAddressSchema
        .required()
        .messages({
            "any.required": "Shipping address is required",
        }),

    paymentMethod: Joi.string()
        .valid("COD", "BKASH", "NAGAD", "CARD", "STRIPE")
        .required()
        .messages({
            "string.base": "Payment method must be a string",
            "any.only": "Payment method must be either COD, BKASH, NAGAD, CARD, or STRIPE",
            "any.required": "Payment method is required",
        }),

    discount: Joi.number()
        .min(0)
        .default(0)
        .optional()
        .messages({
            "number.min": "Discount cannot be negative",
        }),

    deliveryCharge: Joi.number()
        .min(0)
        .default(0)
        .optional()
        .messages({
            "number.min": "Delivery charge cannot be negative",
        }),
}).options({
    allowUnknown: false,
}).messages({
    "object.unknown": "{{#label}} is not allowed",
});
