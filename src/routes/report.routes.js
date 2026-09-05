const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController')
const authGuard = require('../middlewares/authGuard.middleware')
const roleGuard = require('../middlewares/roleGuard.middleware')

//reports expose store-wide/admin data, so only admins may read them
const REPORT_VIEW_ROLES = ["ADMIN", "SUPER_ADMIN"];

// router.use(authGuard, roelGuard(...REPORT_VIEW_ROLES))

router.get('/order-status-wise-summary', reportController.orderStatusWiseSummary)
router.get('/user-count-report', reportController.userCountReport)
router.get('/order-revenue-summary', reportController.orderRevenueSummary)
router.get('/discount-deliveryCharge-report', reportController.discountDeliveryChargeReport)
router.get('/top-selleing-products', reportController.topSellingProducts)
router.get('/top-selleing-varients-sku-wise', reportController.topSellingVariantsSkuWise)
router.get('/low-stock-alert-report', reportController.lowStockAlertReport)
router.get('/inventory-valuation-report', reportController.inventoryValuationReport)
router.get('/product-wise-price-range-report', reportController.productWisePriceRangeReport)

module.exports = router