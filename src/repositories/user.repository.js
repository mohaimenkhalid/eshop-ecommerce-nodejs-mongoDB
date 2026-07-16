const User = require('../models/user.model');

const createUser = async (payload) => {
    const user = new User(payload);
    return user.save();
};

const findByUsername = async (username) => {
    return User.findOne({ username });
};

const findByUsernameWithPassword = async (username) => {
    return User.findOne({ username }).select('+password');
};

const findAllUsers = async () => {
    return User.find().select('-password -__v');
};

module.exports = {
    createUser,
    findByUsername,
    findByUsernameWithPassword,
    findAllUsers,
};
