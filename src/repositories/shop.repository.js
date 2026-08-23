const Shop = require('../models/shop.model');

exports.createShop = async (payload) => {
    const shop = new Shop(payload);
    return await shop.save();
}

exports.updateById = (id, payload) => {
    return Shop.findByIdAndUpdate(id, payload, {
        returnDocument: 'after',
        runValidators: true,
    })
}

exports.getPaginateShops = ({skip, limit, filter}) => {
    return Shop.find(filter)
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .populate('owner', 'name email phone')
        .sort({ createdAt: -1 })
        .lean();
}

exports.getAllShops = () => {
    return Shop.find({ isDeleted: false, status: 'ACTIVE' })
        .sort({ createdAt: -1 })
        .lean();
}

exports.getTotalShopCount = async (filter) => {
    return Shop.countDocuments(filter);
}

exports.getShopById = (id) => {
    return Shop.findById(id)
        .populate('owner', 'name email phone')
        .lean();
};

exports.getShopBySlug = (slug) => {
    return Shop.findOne({ slug, isDeleted: false })
        .populate('owner', 'name email phone')
        .lean();
};

exports.softDeleteById = (id) => {
    return Shop.findByIdAndUpdate(id, {
        isDeleted: true,
        status: 'INACTIVE',
    }, {
        returnDocument: 'after',
    })
}
