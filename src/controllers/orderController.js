const orderService = require("../services/order.service");
const paymentService = require("../services/payment.service");

exports.createOrder = async (req, res, next) => {
    try {
        const { order, payment } = await orderService.createOrder(
            req.user.userId,
            req.body
        );

        let checkout = null;
        if (order.paymentMethod === "STRIPE") {
            try {
                checkout = await paymentService.createCheckoutSession(
                    req.user.userId,
                    order._id
                );
            } catch (checkoutError) {
                console.error(
                    `Failed to create a checkout session for order ${order.orderNumber}:`,
                    checkoutError.message
                );
            }
        }

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: {
                order,
                payment,
                checkout,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.updateOrder = async (req, res, next) => {
    try {
        await orderService.updateOrder(req.params.orderId, req.body)
        res.status(200).json({
            success: true,
            message: "Order updated successfully",
        })
    } catch (e) {
        next(e);
    }
}

exports.getAllOrderListPaginate = async (req, res, next) => {
    try {
        const {page, limit, orderNumber, paymentStatus, status} = req.query;
        const payload = {page, limit, orderNumber, paymentStatus, status};
        const orders = await orderService.getPaginateOrders(payload);
        return res.status(200).json({
            success: true,
            ...orders
        })
    } catch (e) {
        next(e)
    }
}

exports.getMyOrderListPaginate = async (req, res, next) => {
    try {
        const {page, limit, orderNumber, paymentStatus, status} = req.query;
        const payload = {page, limit, orderNumber, paymentStatus, status};
        const orders = await orderService.getMyPaginateOrders(req.user.userId, payload);
        return res.status(200).json({
            success: true,
            ...orders
        })
    } catch (e) {
        next(e)
    }
}
