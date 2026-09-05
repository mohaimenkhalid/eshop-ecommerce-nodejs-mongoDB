const Order = require('../models/order.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');

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

exports.topSellingVariantsSkuWise = () => {
    return Order.aggregate([
        {
            $match: {
                paymentStatus: "PAID"
            }
        },
        { $unwind: "$items" },
        {
            $group: {
                _id: {
                    p: "$items.productId",
                    v: "$items.variantId"
                },
                productName: {$first: "$items.productName"},
                variantName: {$first: "$items.variantName"},
                totalAmount: {
                    $sum: "$total"
                },
                totalSold: {
                    $sum: "$items.quantity"
                }
            }
        },
        {
            $sort: {
                totalSold: -1
            }
        },
        {
            $limit: 10
        }
    ])
}

exports.lowStockAlertReport = () => {
    return Product.aggregate([
        {
            $match: { isDeleted: false, status: "ACTIVE" }
        },
        { $unwind: "$variants" },
        {
            $match: {
                "variants.stock": {$lt: 10}
            }
        },
        {
            $project: {
                name: 1,
                sku: "$variants.sku",
                stock: "$variants.stock",
                price: "$variants.price",
                image: { $arrayElemAt: ["$variants.images", 0] }
            }
        },
        {
            $sort: { stock: 1 }
        }
    ])
}

exports.inventoryValuationReport = () => {
    return Product.aggregate([
        {
            $match: { isDeleted: false, status: "ACTIVE" }
        },
        { $unwind: "$variants" },
        {
            $group: {
                _id: null,
                totalStockValue: {
                    $sum: {
                        $multiply: ["$variants.stock", "$variants.price"]
                    }
                },
                productCount: {
                    $addToSet: "$_id" //unique ids set to an array
                },
                variantCount: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalStockValue: 1,
                productCount: {
                    $size: "$productCount"
                },
                variantCount: 1
            }
        }
    ])
}

exports.productWisePriceRangeReport = () => {

    //SOLUTION 1:

    // return Product.aggregate([
    //     {
    //         $match: { isDeleted: false, status: "ACTIVE" }
    //     },
    //     {
    //         $unwind: "$variants"
    //     },
    //     {
    //         $group: {
    //             _id: "$_id",
    //             maxVariantPrice: { $max: "$variants.price" },
    //             minVariantPrice: { $min: "$variants.price" },
    //         }
    //     }
    // ])

    // Solution 2:

    return Product.aggregate([
        {
            $match: { isDeleted: false, status: "ACTIVE" }
        },
        {
            $set: { //add new properties with $set
                maxVariantPrice: { $max: "$variants.price" },
                minVariantPrice: { $min: "$variants.price" }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                slug: 1,
                maxVariantPrice: 1,
                minVariantPrice: 1
            }
        }
    ])
}