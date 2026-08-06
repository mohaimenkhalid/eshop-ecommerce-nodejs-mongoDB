const productService = require('../services/product.service')

exports.create = async (req, res, next) => {
    try {
        const product = await productService.create(req.body);
        return res.status(201).json({
            success: true,
            message: "Product created successfully!",
            product
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
}

exports.update = async (req, res, next) => {
    try {
        const product = await productService.update(req.params.id, req.body);
        return res.status(201).json({
            success: true,
            message: "Product updated successfully!",
            product
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
}


exports.addVariant = async (req, res, next) => {
    try {
        const product = await productService.addVariant(req.params.id, req.body);
        return res.status(201).json({
            success: true,
            message: "Variant add successfully!",
            product
        })
    } catch (e) {
        console.log(e)
        next(e)
    }
}

exports.updateVariantById = async (req, res, next) => {
    try {
        const variant = await productService.updateVariantById(req.params.variantId, req.body)
        return res.status(200).json({
            success: true,
            message: "Variant updated successfully!",
            variant
        })
    } catch (e) {
        next(e)
    }
}

exports.deleteVariant = async (req, res, next) => {
    try {
        const variant = await productService.deleteVariant(req.params.variantId)
        return res.status(200).json({
            success: true,
            message: "Variant deleted successfully!",
            variant
        })
    } catch (e) {
        next(e)
    }
}


exports.addVariantImages = async (req, res, next) => {
    try {
        const variant = await productService.addVariantImages(req.params.variantId, req.files);
        return res.status(200).json({
            success: true,
            message: 'Images added successfully!',
            variant,
        });
    } catch (e) {

        next(e)
    }
}

exports.deleteVariantImage = async (req, res, next) => {
    try {
        const variant = await productService.deleteVariantImage(req.params.variantId, req.body.imageUrl);
        return res.status(200).json({
            success: true,
            message: 'Image deleted successfully!',
            variant,
        });
    } catch (e) {
        next(e)
    }
}

