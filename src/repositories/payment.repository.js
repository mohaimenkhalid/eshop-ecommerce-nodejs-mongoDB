const Payment = require("../models/payment.model");

exports.createPayment = async (payload, options = {}) => {
    const payment = new Payment(payload);
    return await payment.save(options);
};

exports.getPaymentById = (id) => {
    return Payment.findById(id).lean();
};

exports.getPaymentByOrderId = (orderId) => {
    return Payment.findOne({ order: orderId }).lean();
};

exports.updatePaymentById = (id, payload, options = {}) => {
    return Payment.findByIdAndUpdate(id, payload, {
        returnDocument: "after",
        runValidators: true,
        ...options,
    });
};

exports.updatePaymentByOrderId = (orderId, payload, options = {}) => {
    return Payment.findOneAndUpdate({ order: orderId }, payload, {
        returnDocument: "after",
        runValidators: true,
        ...options,
    });
};
