import brandService from '../services/brand.service';

exports.create = async (req, res, next) => {
    try {
        await brandService.create(req.body);
        return res.status(201).json({
            success: true,
            message: 'Brand created successfully'
        })
    } catch (e) {
        next(e)
    }
}