const productRepository = require('../repositories/product.repository')
const generateSlug = require("../utils/slugify");
const categoryRepository = require('../repositories/category.repository')
const brandRepository = require('../repositories/brand.reporsitory')
const createError = require('../utils/createError')
const uploadService = require('./upload.service')

exports.getPaginateProducts = async ({page, limit, name, category, brand}) => {
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(
        Math.max(Number(limit) || 10, 1),
        100
    );
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {
        isDeleted: false,
        status: 'ACTIVE',
    };

    if (name) {
        filter.name = {
            $regex: name,
            $options: "i",
        };
    }

    if (category) {
        filter.category = category
    }

    if (brand) {
        filter.brand = brand
    }


    const [products, total] = await Promise.all([
        productRepository.getPaginateProducts({skip, limit: limitNumber, filter }),
        productRepository.getTotalProductCount(filter),
    ]);
    const totalPages = Math.ceil(total / limitNumber);
    return {
        data: products,
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


exports.create = async (body) => {
    const {name, description, category, brand, isFeatured} = body;
    try {

        const categoryFind = await categoryRepository.getCategoryById(category)

        if(!categoryFind) {
            throw createError("category not found", 404)
        }

        const brandFind = await brandRepository.getBrandById(brand)
        if(!brandFind) {
            throw createError("category not found", 404)
        }

        const payload = {
            name,
            slug: generateSlug(name),
            category,
            brand,
            description: description || "",
        };

        if(typeof isFeatured !== 'undefined') {
            payload.isFeatured = isFeatured;
        }

        return productRepository.create(payload)
    } catch (e) {
        throw e;
    }
}

exports.update = async (id, body) => {
    const {name, description, category, brand, isFeatured, status} = body;
    try {

        const product = await productRepository.getProductById(id);
        if(!product) {
            throw createError("Product not found", 404);
        }
        if (product.variants.length === 0 && product.status === 'INACTIVE' && status === 'ACTIVE') {
            throw createError(
                "Cannot activate this product without at least one variant.",
                400
            );
        }

        const categoryFind = await categoryRepository.getCategoryById(category)

        if(!categoryFind) {
            throw createError("category not found", 404)
        }

        const brandFind = await brandRepository.getBrandById(brand)
        if(!brandFind) {
            throw createError("category not found", 404)
        }

        const payload = {
            name,
            slug: generateSlug(name),
            category,
            brand,
            description,
            status
        };

        if(typeof isFeatured !== 'undefined') {
            payload.isFeatured = isFeatured;
        }

        return productRepository.update(id, payload)
    } catch (e) {
        throw e;
    }
}


exports.addVariant = async (id, body) => {
    const {sku, color, size, price, stock} = body;
    try {
        const product = await productRepository.getProductById(id);
        if(!product) {
            throw createError("Product not found", 404);
        }
        const findSku = await product.variants.find(v => v.sku === sku.toUpperCase())
        if (findSku) {
            throw createError("SKU must be unique", 400);
        }
        const payload = {
            sku,
            color,
            size,
            price,
            stock
        }

        const isFirstVariant = !product.variants || product.variants.length === 0;
        const updateStatus = isFirstVariant ? "ACTIVE" : null;

        return await productRepository.addVariant(id, payload, updateStatus)

    } catch (e) {
        throw e
    }
}

exports.updateVariantById = async (variantId, body) => {
    const {sku, color, size, price, stock} = body;
    try {
        const payload = {
            sku,
            color,
            size,
            price,
            stock
        }
        if(sku) {
            const variant = await productRepository.findVariantBySku(sku.toUpperCase());

            if (variant && !variant._id.equals(variantId)) {
                throw createError("SKU must be unique", 400);
            }

        }
        const product = await productRepository.updateVariantById(variantId, payload)
        console.log("product", product)
        if (!product) {
            throw createError("Variant not found", 404);
        }

        return product;
    } catch (e) {
        throw e
    }
}

exports.deleteVariant = async (variantId) => {
    try {
        const product = await productRepository.deleteVariant(variantId);
        if (!product) {
            throw createError('Variant not found', 404);
        }

        return product;
    } catch (e) {
        throw e;
    }
}

exports.addVariantImages = async (variantId, files) => {
    try {
        if (!files || files.length === 0) {
            throw createError('At least one image is required.', 400);
        }

        // Verify the variant exists
        const existing = await productRepository.findVariantById(variantId);
        if (!existing) {
            throw createError('Variant not found', 404);
        }

        // Upload all files (works for both single and multiple)
        const uploadedFiles = await uploadService.uploadMultiple(files, 'variants');
        const imageUrls = uploadedFiles.map((f) => f.url);

        return await productRepository.addVariantImages(variantId, imageUrls);
    } catch (e) {
        throw e;
    }
}

exports.deleteVariantImage = async (variantId, imageUrl) => {
    try {
        const existing = await productRepository.findVariantById(variantId);
        if (!existing) {
            throw createError('Variant not found', 404);
        }

        if (!existing.images.includes(imageUrl)) {
            throw createError('Image not found on this variant', 404);
        }

        const variant = await productRepository.deleteVariantImage(variantId, imageUrl);

        await uploadService.deleteFile(imageUrl.replace(/^\/uploads/, 'src/uploads'));

        return variant;
    } catch (e) {
        throw e;
    }
}
