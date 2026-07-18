const Joi = require('joi')

exports.signUpSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .required()
        .messages({
            "string.empty": "Name is required",
            "string.min": "Name must be at least 3 characters",
            "string.max": "Name cannot exceed 50 characters",
            "any.required": "Name is required",
        }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            "string.email": "Please enter a valid email address",
            "string.empty": "Email is required",
            "any.required": "Email is required",
        }),
    password: Joi.string()
        .min(8)
        .max(20)
        .required()
        .messages({
            "string.empty": "Password is required",
            "string.min": "Password must be at least 8 characters",
            "string.max": "Password cannot exceed 20 characters",
            "any.required": "Password is required",
        }),
    phone: Joi.string()
        .allow("")
        .pattern(/^01[3-9]\d{8}$/)
});

exports.signInSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            "string.email": "Please enter a valid email address",
            "string.empty": "Email is required",
            "any.required": "Email is required",
        }),
    password: Joi.string()
        .required()
        .messages({
            "string.empty": "Password is required",
            "any.required": "Password is required",
        }),
});