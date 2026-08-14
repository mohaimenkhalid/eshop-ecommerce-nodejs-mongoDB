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

exports.incrementCartQuantity = async (userId, cartId, quantity=1) => {
    return await Cart.findOneAndUpdate({
        _id: cartId,
        user: userId,
    }, {
        $inc: { quantity: quantity }
    }, {
        new: true
    })
}

exports.updateCartQuantity = async (userId, cartId, quantity) => {
    return await Cart.findOneAndUpdate({
        _id: cartId,
        user: userId,
    }, {
        $set: { quantity: quantity }
    }, {
        new: true
    })
}