const Product = require('../models/product.model')


exports.create = async (payload) => {
    const product = new Product(payload)
    return await product.save();
}

exports.update = async (id, payload) => {
    return await Product.findByIdAndUpdate(id, payload, {
        returnDocument: 'after',
        runValidators: true
    })
}

exports.getProductById = (id) => {
    return  Product.findById(id).lean();
}
