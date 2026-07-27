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

exports.getPaginateBrands = async (req, res, next) => {
    try {
        console.log(req.query);
        const {page, limit, name, status} = req.query;
        const payload = {page, limit, name, status};
        const brands = await brandService.getPaginateBrands(payload);
        return res.status(200).json({
            success: true,
            brands: brands
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