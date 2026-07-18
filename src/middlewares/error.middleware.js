module.exports = (err, req, res, next) => {
    // Joi Validation Error
    if (err.isJoi) {
        const errors = {};

        err.details.forEach((error) => {
            errors[error.path[0]] = error.message.replace(/"/g, "");
        });

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    // Validation Error
    if (err.name === "ValidationError") {
        const errors = {};

        Object.values(err.errors).forEach((error) => {
            errors[error.path] = error.message;
        });

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }
    // Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];

        return res.status(409).json({
            success: false,
            message: `${field} already exists`,
            errors: {
                [field]: `${field} is already in use`,
            },
        });
    }
    //Invalid mongoID
    if (err.name === "ReferenceError") {
        return res.status(400).json({
            success: false,
            message: "Invalid ID",
            errors: {
                [err.path]: "Invalid ObjectId",
            },
        });
    }
    if (err.name === "Error") {
        const errors = {};

        err.errors && err.errors.length && Object.values(err.errors).forEach((error) => {
            errors[error.path] = error.message;
        });

        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
};