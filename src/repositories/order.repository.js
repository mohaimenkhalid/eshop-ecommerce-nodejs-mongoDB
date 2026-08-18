const Order = require("../models/order.model");

exports.createOrder = async (payload, options = {}) => {
    const order = new Order(payload);
    return await order.save(options);
};

exports.getOrderById = (id) => {
    return Order.findById(id).lean();
};

exports.getOrdersByUserId = (userId) => {
    return Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .lean();
};

exports.updateOrderById = (id, payload, options = {}) => {
    return Order.findByIdAndUpdate(id, payload, {
        returnDocument: "after",
        runValidators: true,
        ...options,
    });
};
