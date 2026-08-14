const cartService = require("../services/cart.service");
exports.addToCart = async (req, res, next) => {
    try {
        const cart = await cartService.addToCart(req.user, req.body);
        return res.status(201).json({
            success: true,
            cart,
            message: 'Product is added to cart successfully'
        })
    } catch (e) {
        next(e)
    }
}

exports.cartQuantityUpdate = async (req, res, next) => {
    try {
        const cart = await cartService.cartQuantityUpdate(req.user, req);
        return res.status(200).json({
            success: true,
            cart,
            message: 'Cart updated successfully'
        })
    } catch (e) {
        next(e)
    }
}