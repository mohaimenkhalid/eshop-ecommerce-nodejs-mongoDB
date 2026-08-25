const Joi = require("joi");

exports.createCheckoutSessionSchema = Joi.object({
    orderId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            "string.empty": "Order id is required",
            "string.hex": "Order id must be a valid id",
            "string.length": "Order id must be a valid id",
            "any.required": "Order id is required",
        }),
}).options({
    allowUnknown: false,
}).messages({
    "object.unknown": "{{#label}} is not allowed",
});
