const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController')

router.get('/order-status-wise-summary', reportController.orderStatusWiseSummary)
router.get('/user-count-report', reportController.userCountReport)

module.exports = router