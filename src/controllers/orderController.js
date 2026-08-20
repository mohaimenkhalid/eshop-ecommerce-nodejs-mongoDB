const orderService = require("../services/order.service");

exports.createOrder = async (req, res, next) => {
    try {
        const { order, payment } = await orderService.createOrder(
            req.user.userId,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: {
                order,
                payment,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllOrderListPaginate = async (req, res, next) => {
    const {page, limit, orderNumber, paymentStatus, status} = req.query;
    const payload = {page, limit, orderNumber, paymentStatus, status};
    const orders = await orderService.getPaginateOrders(payload);
    return res.status(200).json({
        success: true,
        ...orders
    })
}
