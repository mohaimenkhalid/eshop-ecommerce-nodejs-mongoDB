const categoryRepository = require('../repositories/category.repository');
const generateSlug = require('../utils/slugify');
const uploadService = require('../services/upload.service');
const createError = require('../utils/createError');

exports.getPaginateCategories = async ({page, limit, name, status, parentCategory}) => {
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(
        Math.max(Number(limit) || 10, 1),
        100
    );
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {
        isDeleted: false,
    };

    if (name) {
        filter.name = {
            $regex: name,
            $options: "i",
        };
    }

    if (status) {
        filter.status = status;
    }

    if (parentCategory) {
        filter.parentCategory = parentCategory === 'null' ? null : parentCategory;
    }

    const [categories, total] = await Promise.all([
        categoryRepository.getPaginateCategories({skip, limit: limitNumber, filter }),
        categoryRepository.getTotalCategoryCount(filter),
    ]);
    const totalPages = Math.ceil(total / limitNumber);
    return {
        data: categories,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasPrev: pageNumber > 1,
            hasNext: pageNumber < totalPages,
        }
    }
}

exports.getAllCategories = async () => {
    return await categoryRepository.getAllCategories();
}
