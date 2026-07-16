const userRepository = require('../repositories/user.repository');

exports.getAllUsers = async () => {
    return userRepository.findAllUsers();
};
