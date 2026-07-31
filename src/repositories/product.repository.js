const Product = require('../models/product.model')


exports.create = async (payload) => {
    const product = new Product(payload)
    return await product.save();
}