const authService = require('../services/auth.service');

exports.signup = async (req, res, next) => {
    try {
        await authService.signup(req.body);
        return res.status(201).json({
            success: true,
            message: 'Account created successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.signIn = async (req, res, next) => {
    try {
        const { token } = await authService.signIn(req.body);
        return res.status(200).json({
            success: true,
            access_token: token,
            message: 'Login successful!'
        });
    } catch (error) {
        next(error);
    }
};
