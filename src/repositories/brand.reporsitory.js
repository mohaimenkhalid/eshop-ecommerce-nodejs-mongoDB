const Brand = require('../models/brand.model');

exports.createBrand = async (payload) => {
    const brand = new Brand(payload);
    return await brand.save();
}

exports.getPaginateBrands = ({skip, limit, filter}) => {
    return Brand.find(filter)
            .skip(skip)
            .limit(limit)
            .select('-__v')
            .sort({ createdAt: -1 })
            .lean();
}

exports.getAllBrands = () => {
    return Brand.find()
        .sort({ createdAt: -1 })
        .lean();
}

exports.getTotalBrandCount = async (filter) => {
    return Brand.countDocuments(filter);
}