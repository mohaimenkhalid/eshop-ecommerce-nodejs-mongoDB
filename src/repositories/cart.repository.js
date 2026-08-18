const Cart = require('../models/cart.model')

exports.getAllCarts = (userId) => {
    return Cart.find({
        user: userId
    }).lean();
}

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

exports.cartItemDelete = async (userId, cartId) => {
    return await Cart.findOneAndDelete({
        _id: cartId,
        user: userId
    })
}

exports.clearCartByUserId = async (userId, options = {}) => {
    return await Cart.deleteMany({ user: userId }, options);
}