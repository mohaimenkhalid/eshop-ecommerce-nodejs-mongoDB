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