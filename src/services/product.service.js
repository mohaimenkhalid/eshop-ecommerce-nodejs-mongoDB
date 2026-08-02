const productRepository = require('../repositories/product.repository')
const generateSlug = require("../utils/slugify");
const categoryRepository = require('../repositories/category.repository')
const brandRepository = require('../repositories/brand.reporsitory')
const  createError = require('../utils/createError')


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
        const payload = {
            sku,
            color,
            size,
            price,
            stock
        }
        return await productRepository.addVariant(id, payload)

    } catch (e) {
        throw e
    }
}