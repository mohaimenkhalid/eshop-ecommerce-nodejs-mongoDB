const express = require('express')
const router = express.Router()
const authRoutes = require('./auth.routes')
const brandRoutes = require('./brand.routes')

router.use('/auth', authRoutes)
router.use('/brands', brandRoutes)

module.exports = router;