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
    } catch (e) {
        // if failed to insert data in database then upload file remove from here
        if (req.file) {
            await uploadService.deleteFile(req.file.path)
        }
        throw e;
    }
}
