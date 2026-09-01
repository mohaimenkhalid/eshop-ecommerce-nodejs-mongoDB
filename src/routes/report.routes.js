const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController')

router.get('/order-status-wise-summary', reportController.orderStatusWiseSummary)
router.get('/user-count-report', reportController.userCountReport)
router.get('/order-revenue-summary', reportController.orderRevenueSummary)
router.get('/discount-deliveryCharge-report', reportController.discountDeliveryChargeReport)
router.get('/top-selleing-products', reportController.topSellingProducts)
router.get('/top-selleing-varients-sku-wise', reportController.topSellingVariantsSkuWise)
router.get('/low-stock-alert-report', reportController.lowStockAlertReport)

module.exports = router