const express = require('express')
const router = express.Router()
const authRoutes = require('./auth.routes')
const brandRoutes = require('./brand.routes')
const categoryRoutes = require('./category.routes')
const productRoutes = require('./product.routes')
const cartRoutes = require('./cart.routes')
const orderRoutes = require('./order.routes')
const {globalRateLimiter} = require('../middlewares/rateLimiter')

router.use('/auth', globalRateLimiter, authRoutes)
router.use('/brands', globalRateLimiter, brandRoutes)
router.use('/categories', globalRateLimiter, categoryRoutes)
router.use('/products', globalRateLimiter, productRoutes)
router.use('/carts', globalRateLimiter, cartRoutes)
router.use('/orders', globalRateLimiter, orderRoutes)

module.exports = router;