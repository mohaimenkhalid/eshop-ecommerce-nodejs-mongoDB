const reportRepository = require('../repositories/report.repository')

exports.orderStatusWiseSummary = async () => {
    return await reportRepository.orderStatusWiseSummary()
}

exports.userCountReport = async () => {
    return await reportRepository.userCountReport()
}

exports.orderRevenueSummary = async () => {
    return await reportRepository.orderRevenueSummary()
}

exports.discountDeliveryChargeReport = async () => {
    return await reportRepository.discountDeliveryChargeReport()
}

exports.topSellingProducts = async () => {
    return await reportRepository.topSellingProducts()
}

exports.topSellingVariantsSkuWise = async () => {
    return await reportRepository.topSellingVariantsSkuWise()
}

exports.lowStockAlertReport = async () => {
    return await reportRepository.lowStockAlertReport()
}

exports.inventoryValuationReport = async () => {
    return await reportRepository.inventoryValuationReport()
}

exports.productWisePriceRangeReport = async () => {
    return await reportRepository.productWisePriceRangeReport()
}

exports.topCustomerBySpending = async () => {
    return await reportRepository.topCustomerBySpending()
}

exports.categoryWiseSalesReport = async () => {
    return await reportRepository.categoryWiseSalesReport()
}

exports.brandWiseSalesReport = async () => {
    return await reportRepository.brandWiseSalesReport()
}
exports.shopWiseSalesReport = async () => {
    return await reportRepository.shopWiseSalesReport()
}
exports.shopWisePerformanceDashboard = async () => {
    return await reportRepository.shopWisePerformanceDashboard()
}