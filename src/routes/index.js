const express = require('express')
const router = express.Router()
const authRoutes = require('./auth.routes')
const brandRoutes = require('./brand.routes')
const categoryRoutes = require('./category.routes')

router.use('/auth', authRoutes)
router.use('/brands', brandRoutes)
router.use('/categories', categoryRoutes)

module.exports = router;