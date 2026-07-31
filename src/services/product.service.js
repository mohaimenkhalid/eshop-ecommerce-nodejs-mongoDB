const productRepository = require('../repositories/product.repository')
exports.create = (body) => {
    try {
        body.variants = JSON.parse(body.variants)
        return productRepository.create(body)
    } catch (e) {
        throw e;
    }
}