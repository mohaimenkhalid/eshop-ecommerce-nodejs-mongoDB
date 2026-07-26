const Brand = require('../models/brand.model');

exports.createBrand = async (payload) => {
    const brand = new Brand(payload);
    return await brand.save();
}