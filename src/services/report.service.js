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