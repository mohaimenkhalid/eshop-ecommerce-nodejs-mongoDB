const categoryRepository = require('../repositories/category.repository');
const generateSlug = require('../utils/slugify');
const uploadService = require('../services/upload.service');
const createError = require('../utils/createError');
const { redisClient } = require("../config/redis");
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
    const cached = await redisClient.get('categories')
    if (cached) {
        return JSON.parse(cached);
    }
    const newaCategories = await categoryRepository.getAllCategories();
    await redisClient.set('categories', JSON.stringify(newaCategories));
    return newaCategories;
}

exports.create = async (req) => {
    try {
        const {name, parentCategory, isFeatured, status} = req.body;
        let uploadedImage = null;
        if(req.file) {
            uploadedImage = await uploadService.uploadSingle(req.file, "categories");
        }

        // Validate if parentCategory exists in DB
        if (parentCategory) {
            const parent = await categoryRepository.getCategoryById(parentCategory);
            if (!parent) {
                throw createError("Parent category not found", 404);
            }
        }

        const payload = {
            name,
            slug: generateSlug(name),
            image: uploadedImage?.url,
            parentCategory: parentCategory || null,
            isFeatured,
            status,
        }
        await categoryRepository.createCategory(payload)
        await redisClient.del('categories');
    } catch (e) {
        // if failed to insert data in database then upload file remove from here
        if (req.file) {
            await uploadService.deleteFile(req.file.path)
        }
        throw e;
    }
}

exports.update = async (id, body, file) => {
    try {
        const {name, parentCategory, isFeatured, status} = body;
        let uploadedImage = null;
        if(file) {
            uploadedImage = await uploadService.uploadSingle(file, "categories");
        }

        let payload = {};
        if(name) {
            payload.name = name;
            payload.slug = generateSlug(name);
        }

        if(uploadedImage) {
            payload.image = uploadedImage?.url;
        }

        if (typeof isFeatured !== "undefined") {
            payload.isFeatured = isFeatured;
        }

        if (status) {
            payload.status = status;
        }

        if (typeof parentCategory !== "undefined") {
            if (parentCategory === id) {
                throw createError("A category cannot be its own parent", 400);
            }
            if (parentCategory) {
                const parent = await categoryRepository.getCategoryById(parentCategory);
                if (!parent) {
                    throw createError("Parent category not found", 404);
                }
            }
            payload.parentCategory = parentCategory || null;
        }

        const category = await categoryRepository.getCategoryById(id);

        if (!category) {
            throw createError("Category not found", 404)
        }

        const updatedCategory = await categoryRepository.updateById(id, payload);

        if (updatedCategory && uploadedImage?.url && category.image) { //if category updated, new uploaded image url, prev category image if exist
            await uploadService.deleteFile(`src${category.image}`)
        }
        await redisClient.del('categories');

        return updatedCategory;

    } catch (e) {
        if (file) {
            await uploadService.deleteFile(file.path)
        }
        throw e;
    }
}

exports.delete = async (id) => {
    try {
        const category = await categoryRepository.getCategoryById(id);
        if (!category) {
            throw createError("Category not found", 404)
        }
        if (category.isDeleted) {
            throw createError("Category already deleted", 400);
        }
        await redisClient.del('categories');
        return await categoryRepository.softDeleteById(id)
    } catch (e) {
        throw e;
    }
}
