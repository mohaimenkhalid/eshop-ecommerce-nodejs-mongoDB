const Brand = require('../models/brand.model');

exports.createBrand = (payload) => {
    const brand = new Brand(payload);
    return brand.save();
}