const Order = require("../models/order.model");

exports.getPaginateOrders = ({skip, limit, filter}) => {
    return Order.find(filter)
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .sort({ createdAt: -1 })
        .lean();
}

exports.getTotalOrderCount = (filter) => {
    return Order.countDocuments(filter)
}

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
