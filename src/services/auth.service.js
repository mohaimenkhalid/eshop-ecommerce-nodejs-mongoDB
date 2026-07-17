const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};


exports.signup = async ({ name, phone, email, password }) => {

    const hashedPassword = await bcrypt.hash(password, 10);
    return userRepository.createUser({
        name,
        phone,
        email,
        password: hashedPassword,
    });
};

exports.signIn = async ({ username, password }) => {
    if (!username || !password) {
        throw createError('Username and password are required.', 400);
    }

    const user = await userRepository.findByUsernameWithPassword(username);
    if (!user) {
        throw createError('Invalid username or password', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        throw createError('Invalid username or password', 401);
    }

    if (user.status === 'inactive') {
        throw createError('Your account is inactive.', 403);
    }

    const token = jwt.sign(
        {
            userId: user._id,
            name: user.name,
            username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return { token };
};
