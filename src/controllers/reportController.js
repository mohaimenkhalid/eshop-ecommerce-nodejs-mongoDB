const reportService = require('../services/report.service');

exports.orderStatusWiseSummary = async (req, res) => {
    const data = await reportService.orderStatusWiseSummary();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.userCountReport = async (req, res) => {
    const data = await reportService.userCountReport();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.orderRevenueSummary = async (req, res) => {
    const data = await reportService.orderRevenueSummary();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.discountDeliveryChargeReport = async (req, res) => {
    const data = await reportService.discountDeliveryChargeReport();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.topSellingProducts = async (req, res) => {
    const data = await reportService.topSellingProducts();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.topSellingVariantsSkuWise = async (req, res) => {
    const data = await reportService.topSellingVariantsSkuWise();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.lowStockAlertReport = async (req, res) => {
    const data = await reportService.lowStockAlertReport();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.inventoryValuationReport = async (req, res) => {
    const data = await reportService.inventoryValuationReport();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.productWisePriceRangeReport = async (req, res) => {
    const data = await reportService.productWisePriceRangeReport();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.topCustomerBySpending = async (req, res) => {
    const data = await reportService.topCustomerBySpending();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.categoryWiseSalesReport = async (req, res) => {
    const data = await reportService.categoryWiseSalesReport();
    res.status(200).send({
        success: true,
        data: data
    })
}
exports.brandWiseSalesReport = async (req, res) => {
    const data = await reportService.brandWiseSalesReport();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.shopWiseSalesReport = async (req, res) => {
    const data = await reportService.shopWiseSalesReport();
    res.status(200).send({
        success: true,
        data: data
    })
}

exports.shopWisePerformanceDashboard = async (req, res) => {
    const data = await reportService.shopWisePerformanceDashboard();
    res.status(200).send({
        success: true,
        data: data
    })
}