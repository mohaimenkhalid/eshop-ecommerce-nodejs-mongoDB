const Order = require('../models/order.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Shop = require('../models/shop.model');

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

exports.topCustomerBySpending = () => {
    return Order.aggregate([
        {
            $group: {
                _id: "$user",
                totalOrderCount: {
                    $sum: 1
                },
                totalSpendAmount: {
                    $sum: "$total"
                },
                avgOrderValue: {
                    $avg: "$total"
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            email: 1,
                            phone: 1,
                            avatar: 1
                        }
                    }
                ],
                as: "user",
            }
        },
        {
            $sort: {
                totalSpendAmount: -1
            }
        },
        {
            $limit: 10
        }
    ])
}


exports.categoryWiseSalesReport = () => {
    return Order.aggregate([
        { $match: { paymentStatus: "PAID" } },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "product",
            }
        },
        { $unwind: "$product" },
        {
            $group: {
                _id: "$product.category",
                totalAmountSale: { $sum: "$items.totalPrice" },
                totalQuantity: { $sum: "$items.quantity" }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: "_id",
                foreignField: "_id",
                as: "category",
                // pipeline: [
                //     {
                //         $project: {
                //             _id: 1,
                //             name: 1,
                //         }
                //     }
                // ]
            }
        },
        { $unwind: '$category' },
        {
            $project: {
                category: "$category.name",
                totalAmountSale: 1,
                totalQuantity: 1
            }
        }
    ])
}

exports.brandWiseSalesReport = () => {
    return Order.aggregate([
        { $match: { "paymentStatus": "PAID" } },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $group: {
                _id: "$product.brand",
                totalSaleAmount: { $sum: "$items.totalPrice"},
                totalQuantity: { $sum: "$items.quantity"}
            }
        },
        {
            $lookup: {
                from: 'brands',
                localField: "_id",
                foreignField: "_id",
                as: 'brand'
            }
        },
        {$unwind: "$brand"},
        {
            $project: {
                brand: "$brand.name",
                totalSaleAmount: 1,
                totalQuantity: 1
            }
        }
    ])
}

exports.shopWiseSalesReport = () => {
    return Order.aggregate([
        { $match: { paymentStatus: "PAID" } },
        { $unwind: "$items" },
        {
            $lookup: {
                from: "products",
                localField: "items.productId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $lookup: {
                from: "shops",
                localField: "product.shop",
                foreignField: "_id",
                as: "shop"
            }
        },
        {$unwind: "$shop"},
        {
            $lookup: {
                from: "users",
                localField: "shop.owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {$unwind: "$owner"},
        {
            $group: {
                _id: "$shop._id",
                shop: { $first: "$shop.name" },
                shopOwner: { $first: "$owner.name" },
                totalOrderCount: { $sum: 1 },
                totalOrderAmount: { $sum: "$items.totalPrice" },
            }
        }
    ])
}

exports.shopWisePerformanceDashboard = () => {
    return Shop.aggregate([
        {$match: { isDeleted: false }},
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "shop",
                as: "products"
            }
        },
        {
            $project: {
                _id: 1,
                shopName: "$name",
                totalProducts: { $size: "$products"},
                totalActiveProducts: {
                    $size: {
                        $filter: {
                            input: "$products",
                            as: "product",
                            cond: {
                                $eq: ["$$product.status", "ACTIVE"]
                            }
                        }
                    }
                },
                totalStock: {
                    $sum: {
                        $map: {
                            input: "$products",
                            as: "product",
                            in: {
                                $reduce: {
                                    input: "$$product.variants",
                                    initialValue: 0,
                                    in: {
                                        $add: ["$$value", "$$this.stock"]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ])
}

exports.neverSoldProductsReport = () => {
    return Product.aggregate([
        {
            $match: { status: "ACTIVE" }
        },
        {
            $lookup: {
                from: "orders",
                localField: "_id",
                foreignField: "items.productId",
                as: "orders"
            }
        },
        { $match: { orders: { $size: 0 } }}
    ])
}

exports.paymentReconciliationReport = () => {
    return Order.aggregate([
        {
            $match: {
                paymentStatus: "PAID"
            }
        },
        {
            $lookup: {
                from: "payments",
                localField: "_id",
                foreignField: "order",
                let: {
                    orderPrice: "$total"
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $ne: ["$$orderPrice", "$amount"]
                            }
                        }
                    }
                ],
                as: "payment"
            }
        },
        {
            $unwind: "$payment"
        }
    ]);
};

exports.customerDetailsReport = () => {
    return User.aggregate([
        { $match: { role: "USER" } },
        {
            $lookup: {
                from: "orders",
                localField: "_id",
                foreignField: "user",
                as: "orders"
            }
        },
        // {
        //     $set: {
        //         orderCount: { $size: "$orders" },
        //         totalSpent: { $sum: "$orders.total" },
        //         lastOrderDate: { $max: "$orders.createdAt" }
        //     }
        // },
        {
            $lookup: {
                from: "addresses",

                let: {
                    userId: "$_id"
                },

                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$user", "$$userId"] },
                                    { $eq: ["$isDefault", true] }
                                ]
                            }
                        }
                    }
                ],

                as: "defaultAddress"
            }
        },
        {
            $project: {
                name: 1,
                email: 1,
                phone: 1,
                orderCount: { $size: "$orders" },
                totalSpent: { $sum: "$orders.total" },
                lastOrderDate: { $max: "$orders.createdAt" },
                defaultAddress: 1
            }
        }
    ])
}