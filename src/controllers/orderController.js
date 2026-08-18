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
