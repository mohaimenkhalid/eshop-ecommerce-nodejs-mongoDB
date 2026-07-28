const brandService = require('../services/brand.service');

exports.create = async (req, res, next) => {
    try {
        await brandService.create(req);
        return res.status(201).json({
            success: true,
            message: 'Brand created successfully'
        })
    } catch (e) {
        //console.log(req)
        next(e)
    }
}

exports.update = async (req, res, next) => {
    try {
        const updatedBrand = await brandService.update(req.params.id, req.body, req.file)
        return res.status(200).json({
            success: true,
            brand: updatedBrand,
            message: "Brand updated successfully",
        });
    } catch (e) {
        console.log(e)
        next(e)
    }
}

exports.getPaginateBrands = async (req, res, next) => {
    try {
        const {page, limit, name, status} = req.query;
        const payload = {page, limit, name, status};
        const response = await brandService.getPaginateBrands(payload);
        return res.status(200).json({
            success: true,
            ...response
        })
    } catch (e) {
        next(e)
    }
}

exports.getAllBrands = async (req, res, next) => {
    try {
        const brands = await brandService.getAllBrands();
        return res.status(200).json({
            success: true,
            brands: brands
        })
    } catch (e) {
        next(e)
    }
}

exports.delete = async (req, res, next) => {
    try {
        await brandService.delete(req.params.id)
        return res.status(200).json({
            success: true,
            message: "Brand deleted successfully"
        })
    } catch (e) {
        next(e)
    }
}