const Brand = require('../models/brand.model');

exports.createBrand = async (payload) => {
    const brand = new Brand(payload);
    return await brand.save();
}

exports.updateById = (id, payload) => {
    return Brand.findByIdAndUpdate(id, payload, {
        returnDocument: 'after',
        runValidators: true,
    })
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

exports.getBrandById = (id) => {
    return Brand.findById(id).lean();
};

exports.softDeleteById = (id) => {
    return Brand.findByIdAndUpdate(id, {
        isDeleted: true
    }, {
        returnDocument: 'after',
    })
}