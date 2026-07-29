const categoryService = require('../services/category.service');

exports.getPaginateCategories = async (req, res, next) => {
    try {
        const {page, limit, name, status, parentCategory} = req.query;
        const payload = {page, limit, name, status, parentCategory};
        const response = await categoryService.getPaginateCategories(payload);
        return res.status(200).json({
            success: true,
            ...response
        })
    } catch (e) {
        next(e)
    }
}

exports.getAllCategories = async (req, res, next) => {
    try {
        const categories = await categoryService.getAllCategories();
        return res.status(200).json({
            success: true,
            categories: categories
        })
    } catch (e) {
        next(e)
    }
}

exports.create = async (req, res, next) => {
    try {
        await categoryService.create(req);
        return res.status(201).json({
            success: true,
            message: 'Category created successfully'
        })
    } catch (e) {
        next(e)
    }
}
