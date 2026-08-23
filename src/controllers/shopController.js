const shopService = require('../services/shop.service');

exports.create = async (req, res, next) => {
    try {
        const shop = await shopService.create(req);
        return res.status(201).json({
            success: true,
            shop: shop,
            message: 'Shop created successfully'
        })
    } catch (e) {
        next(e)
    }
}

exports.update = async (req, res, next) => {
    try {
        const updatedShop = await shopService.update(req.params.id, req.body, req.files, req.user)
        return res.status(200).json({
            success: true,
            shop: updatedShop,
            message: "Shop updated successfully",
        });
    } catch (e) {
        next(e)
    }
}

exports.getPaginateShops = async (req, res, next) => {
    try {
        const {page, limit, name, status, isFeatured, owner} = req.query;
        const payload = {page, limit, name, status, isFeatured, owner};
        const response = await shopService.getPaginateShops(payload);
        return res.status(200).json({
            success: true,
            ...response
        })
    } catch (e) {
        next(e)
    }
}

exports.getAllShops = async (req, res, next) => {
    try {
        const shops = await shopService.getAllShops();
        return res.status(200).json({
            success: true,
            shops: shops
        })
    } catch (e) {
        next(e)
    }
}

exports.getShopById = async (req, res, next) => {
    try {
        const shop = await shopService.getShopById(req.params.id);
        return res.status(200).json({
            success: true,
            shop: shop
        })
    } catch (e) {
        next(e)
    }
}

exports.delete = async (req, res, next) => {
    try {
        await shopService.delete(req.params.id, req.user)
        return res.status(200).json({
            success: true,
            message: "Shop deleted successfully"
        })
    } catch (e) {
        next(e)
    }
}
