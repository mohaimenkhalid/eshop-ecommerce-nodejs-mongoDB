const reportService = require('../services/report.service');

exports.orderStatusWiseSummary = async (req, res) => {
    const data = await reportService.orderStatusWiseSummary();
    res.status(200).send({
        success: true,
        data: data
    })
}