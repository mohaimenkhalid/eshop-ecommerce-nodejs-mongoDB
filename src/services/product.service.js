const productRepository = require('../repositories/product.repository')
const generateSlug = require("../utils/slugify");
const categoryRepository = require('../repositories/category.repository')
const brandRepository = require('../repositories/brand.reporsitory')
const createError = require('../utils/createError')
const uploadService = require('./upload.service')
const {redisClient} = require('../config/redis')
const shopRepository = require("../repositories/shop.repository");

exports.getPaginateProducts = async ({page, limit, name, category, brand}) => {
    let version = await redisClient.get("products:version");
    if (!version) {
        version = await redisClient.set(
            "products:version",
            1,
            { NX: true }
        );

        version = 1;
    }

    //Create Cache key
    const key = `products:v${version}:page:${page}:limit:${limit}${name ? `:name:${name}` : ""}${category ? `:category:${category}` : ""}${brand ? `:brand:${brand}` : ""}`;
    const cached = await redisClient.get(key);
    if (cached) {
        return JSON.parse(cached);
    }
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
    const finalRes = {
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
    if(products.length) {
        await redisClient.set(
            key,
            JSON.stringify(finalRes),
            {
                EX: 300,
            }
        );
    }

    return finalRes;
}


exports.create = async (body) => {
    const {name, description, shop, category, brand, isFeatured} = body;
    try {

        const categoryFind = await categoryRepository.getCategoryById(category)
        if(!categoryFind) {
            throw createError("category not found", 404)
        }

        const brandFind = await brandRepository.getBrandById(brand)
        if(!brandFind) {
            throw createError("brand not found", 404)
        }

        const payload = {
            name,
            slug: generateSlug(name),
            shop,
            category,
            brand,
            description: description || "",
        };

        if(typeof isFeatured !== 'undefined') {
            payload.isFeatured = isFeatured;
        }
        await redisClient.incr("products:version");

        return productRepository.create(payload)
    } catch (e) {
        throw e;
    }
}

exports.update = async (id, body, userId) => {
    const {name, description, category, brand, isFeatured, status} = body;
    try {
        const product = await productRepository.getProductById(id);
        if(product.shop.owner.toString() !== userId) {
            throw createError("You can only update yours shop product", 403);
        }

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
        await redisClient.incr("products:version");

        return productRepository.update(id, payload)
    } catch (e) {
        throw e;
    }
}


exports.addVariant = async (id, body, userId) => {
    const {sku, color, size, price, stock} = body;
    try {
        const product = await productRepository.getProductById(id);
        if(!product) {
            throw createError("Product not found", 404);
        }
        if(product.shop.owner.toString() !== userId) {
            throw createError("You can only update yours shop product", 403);
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
        await redisClient.incr("products:version");

        return await productRepository.addVariant(id, payload, updateStatus)

    } catch (e) {
        throw e
    }
}

exports.updateVariantById = async (variantId, body, userId) => {
    const {sku, color, size, price, stock} = body;
    try {
        const product = await productRepository.findProductByVariantId(variantId);
        if (!product) {
            throw createError("Variant not found", 404);
        }
        if (product.shop.owner.toString() !== userId) {
            throw createError("You can only update yours shop product", 403);
        }

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
        const updatedVariant = await productRepository.updateVariantById(variantId, payload)
        if (!updatedVariant) {
            throw createError("Variant not found", 404);
        }

        await redisClient.incr("products:version");

        return updatedVariant;
    } catch (e) {
        throw e
    }
}

exports.deleteVariant = async (variantId, userId) => {
    try {
        const product = await productRepository.findProductByVariantId(variantId);
        if (!product) {
            throw createError('Variant not found', 404);
        }
        if (product.shop.owner.toString() !== userId) {
            throw createError("You can only update yours shop product", 403);
        }

        const variant = product.variants.id(variantId);
        const imagesToDelete = variant.images || [];

        let updatedProduct = await productRepository.deleteVariant(variantId);

        // Unlink all images associated with the deleted variant
        if (imagesToDelete.length > 0) {
            for (const imageUrl of imagesToDelete) {
                try {
                    await uploadService.deleteFile(imageUrl.replace(/^\/uploads/, 'src/uploads'));
                } catch (err) {
                    console.error(`Failed to delete image: ${imageUrl}`, err);
                }
            }
        }

        if (updatedProduct.variants.length === 0 && updatedProduct.status === 'ACTIVE') {
            updatedProduct = await productRepository.update(updatedProduct._id, { status: 'INACTIVE' });
        }
        await redisClient.incr("products:version");

        return updatedProduct;
    } catch (e) {
        throw e;
    }
}

exports.addVariantImages = async (variantId, files, userId) => {
    try {
        if (!files || files.length === 0) {
            throw createError('At least one image is required.', 400);
        }

        // Verify the variant exists
        const product = await productRepository.findProductByVariantId(variantId);
        if (!product) {
            throw createError('Variant not found', 404);
        }
        if (product.shop.owner.toString() !== userId) {
            throw createError("You can only update yours shop product", 403);
        }

        // Upload all files (works for both single and multiple)
        const uploadedFiles = await uploadService.uploadMultiple(files, 'variants');
        const imageUrls = uploadedFiles.map((f) => f.url);

        return await productRepository.addVariantImages(variantId, imageUrls);
    } catch (e) {
        throw e;
    }
}

exports.deleteVariantImage = async (variantId, imageUrl, userId) => {
    try {
        const product = await productRepository.findProductByVariantId(variantId);
        if (!product) {
            throw createError('Variant not found', 404);
        }
        if (product.shop.owner.toString() !== userId) {
            throw createError("You can only update yours shop product", 403);
        }

        const existing = product.variants.id(variantId);
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
