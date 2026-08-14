const cartRepository = require('../repositories/cart.repository');
const productRepository = require('../repositories/product.repository');
const createError = require('../utils/createError');
exports.addToCart = async (user, body) => {
    try {
        const product = await productRepository.getProductById(body.product);
        if(!product) {
            throw createError('Product not found', 400);
        }
        const variant = product.variants.find(variant => variant._id.equals(body.variantId))
        if (!variant) {
            throw createError('Variant not found', 400);
        }
        const cart = await cartRepository.getCartByVariantId(user.userId, body.variantId)
        if (cart) {
            //update quantity +1
            return await cartRepository.updateCartQuantity(cart._id);
        }
        //new insert
        const payload = {
            user: user.userId,
            product: body.product,
            variantId: body.variantId,
            quantity: body.quantity,
        }
        return await cartRepository.addToCart(payload)
    } catch (e) {
        throw e;
    }
}