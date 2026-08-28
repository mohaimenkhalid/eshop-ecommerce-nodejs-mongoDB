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