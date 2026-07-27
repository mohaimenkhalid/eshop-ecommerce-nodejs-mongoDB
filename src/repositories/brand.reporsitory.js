const Brand = require('../models/brand.model');

exports.createBrand = async (payload) => {
    const brand = new Brand(payload);
    return await brand.save();
}

exports.getPaginateBrands = async ({skip, limit, filter}) => {
    return Brand.find(filter)
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .sort({ createdAt: -1 })
}

exports.getAllBrands = async () => {
    return Brand.find().select('-__v');
}