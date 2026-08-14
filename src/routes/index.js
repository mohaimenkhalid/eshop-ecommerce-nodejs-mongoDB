const express = require('express')
const router = express.Router()
const authRoutes = require('./auth.routes')
const brandRoutes = require('./brand.routes')
const categoryRoutes = require('./category.routes')
const productRoutes = require('./product.routes')
const cartRoutes = require('./cart.routes')

router.use('/auth', authRoutes)
router.use('/brands', brandRoutes)
router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/carts', cartRoutes)

module.exports = router;