const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController')

router.get('/order-status-wise-summary', reportController.orderStatusWiseSummary)
router.get('/user-count-report', reportController.userCountReport)
router.get('/order-revenue-summary', reportController.orderRevenueSummary)
router.get('/discount-deliveryCharge-report', reportController.discountDeliveryChargeReport)

module.exports = router