module.exports = (err, req, res, next) => {

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
                [field]: `${field} must be unique`,
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
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
};