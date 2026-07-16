const express = require('express')
const router = express.Router()
const todoRoutes = require('./todo.routes')
const userRoutes = require('./user.routes')
const authRoutes = require('./auth.routes')

router.use('/todo', todoRoutes)
router.use('/users', userRoutes)
router.use('/auth', authRoutes)

module.exports = router;