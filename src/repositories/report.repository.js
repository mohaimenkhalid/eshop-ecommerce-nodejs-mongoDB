const Order = require('../models/order.model');
const User = require('../models/user.model');

exports.orderStatusWiseSummary = async () => {
    return Order.aggregate([
        {
            $group: {
                _id: "$status",
                count: {
                    $sum: 1
                },
                totalAmount: {
                    $sum: "$total"
                }
            }
        }
    ])
}

exports.userCountReport = async () => {
    return User.aggregate([
        {
            $match: {
                isDeleted: false
            }
        },
        {
            $group: {
                _id: "$role",

                total: {
                    $sum: 1
                },

                active: {
                    $sum: {
                        $cond: [
                            {$eq: ["$status", "ACTIVE"]},
                            1,
                            0
                        ]
                    }
                },
                inActive: {
                    $sum: {
                        $cond: [
                            {$eq: ["$status", "INACTIVE"]},
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ])
}


exports.orderRevenueSummary = async () => {
    return Order.aggregate([
        {
            $group: {
                _id: null,

                totalOrders: {
                    $sum: 1
                },
                totalPaid: {
                    $sum: {
                        $cond: [
                            {$eq: ["$paymentStatus", "PAID"]}, 1, 0
                        ]
                    }
                },

                totalRevenue: {
                    $sum: {
                        $cond: [
                            {$eq: ["$paymentStatus", "PAID"]},
                            "$total",
                            0
                        ]
                    }
                },
                avgOrderValue: {
                    $avg: {
                        $cond: [
                            {$eq: ["$paymentStatus", "PAID"]},
                            "$total",
                            0
                        ]
                    }
                },

                highestOrder: {
                    $max: "$total"
                },
                lowestOrder: {
                    $min: "$total"
                },
            }
        }
    ])
}

exports.discountDeliveryChargeReport = () => {
    return Order.aggregate([
        {
            $match: {
                paymentStatus: 'PAID'
            }
        },
        {
            $group: {
                _id: null,
                totalOrderAmount: {
                    $sum: "$total"
                },
                totalDiscount: {
                    $sum: "$discount"
                },
                totalDeliveryCharge: {
                    $sum: "$deliveryCharge"
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalOrderAmount: 1,
                totalDiscount: 1,
                totalDeliveryCharge: 1,

                totalDiscountAndDelivery: {
                    $sum: ["$totalDiscount", "$totalDeliveryCharge"]
                },
                discountPercentage: {
                    $multiply: [
                        {
                            $divide: [
                                "$totalDiscount",
                                "$totalOrderAmount"
                            ]
                        },
                        100
                    ]
                }
            }
        }
    ])
}

exports.topSellingProducts = () => {
    return Order.aggregate([
        {
            $match: {paymentStatus: "PAID"},
        },
        {$unwind: "$items"},
        {
            $group: {
                _id: "$items.productId",
                productName: {$first: "$items.productName"},
                totalQuantity: {$sum: "$items.quantity"},
                totalRevenue: {$sum: "$total"},
                orderCount: {$sum: 1}
            }
        },
        {
            $sort: { totalQuantity: -1 }
        },
        { $limit: 10 }

    ])
}