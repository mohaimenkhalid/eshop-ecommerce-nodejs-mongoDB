const Cart = require('../models/cart.model')

exports.addToCart = async (payload) => {
    const cart = await new Cart(payload)
    return await cart.save();
}

exports.getCartByVariantId = async (userId, variantId) => {
    const cart = await Cart.findOne(
        {
        "user": userId,
        "variantId": variantId,
        },
    ).lean()
    if (!cart) {
        return null;
    }
    return cart;
}

exports.updateCartQuantity = async (cartId) => {
    return await Cart.findByIdAndUpdate(cartId, {
        $inc: { quantity: 1 }
    }, {
        new: true
    })
}