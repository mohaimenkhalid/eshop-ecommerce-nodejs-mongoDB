const Category = require('../models/category.model');

exports.createCategory = async (payload) => {
    const category = new Category(payload);
    return await category.save();
}

exports.updateById = (id, payload) => {
    return Category.findByIdAndUpdate(id, payload, {
        returnDocument: 'after',
        runValidators: true,
    })
}

exports.getPaginateCategories = ({skip, limit, filter}) => {
    return Category.find(filter)
            .skip(skip)
            .limit(limit)
            .select('-__v')
            .sort({ createdAt: -1 })
            .populate('parentCategory', 'name slug')
            .lean();
}

exports.getAllCategories = () => {
    return Category.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .populate('parentCategory', 'name slug')
        .lean();
}

exports.getTotalCategoryCount = async (filter) => {
    return Category.countDocuments(filter);
}

exports.getCategoryById = (id) => {
    return Category.findById(id).populate('parentCategory', 'name slug').lean();
};

exports.softDeleteById = (id) => {
    return Category.findByIdAndUpdate(id, {
        isDeleted: true
    }, {
        returnDocument: 'after',
    })
}
