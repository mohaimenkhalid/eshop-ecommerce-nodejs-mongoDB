module.exports = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
        });

        if (error) {
            return next(error)
        }
        req.body = value;
        next();
    };
};