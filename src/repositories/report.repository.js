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
                            { $eq: ["$status", "ACTIVE"] },
                            1,
                            0
                        ]
                    }
                },
                inActive: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "INACTIVE"] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ])
}