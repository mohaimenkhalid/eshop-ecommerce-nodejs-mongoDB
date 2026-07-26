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