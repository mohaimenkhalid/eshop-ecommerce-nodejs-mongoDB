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