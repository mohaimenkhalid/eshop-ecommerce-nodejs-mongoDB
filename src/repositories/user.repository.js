const User = require('../models/user.model');

const createUser = async (payload) => {
    const user = new User(payload);
    return user.save();
};

const findByUsername = async (username) => {
    return User.findOne({ username });
};

const findByEmailWithPassword = async (email) => {
    return User.findOne({ email }).select('+password');
};

const findAllUsers = async () => {
    return User.find().select('-password -__v');
};

const getUserById = async (id) => {
    return User.findById(id).select('-password').lean();
};

module.exports = {
    createUser,
    findByUsername,
    findByEmailWithPassword,
    findAllUsers,
    getUserById,
};
