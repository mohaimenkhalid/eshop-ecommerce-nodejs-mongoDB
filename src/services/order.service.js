const mongoose = require("mongoose");
const orderRepository = require("../repositories/order.repository");
const paymentRepository = require("../repositories/payment.repository");
const productRepository = require("../repositories/product.repository");
const cartRepository = require("../repositories/cart.repository");
const createError = require("../utils/createError");
const Counter = require("../models/counter.model");
const brandRepository = require("../repositories/brand.reporsitory");

exports.getPaginateOrders = async ({page, limit, orderNumber, paymentStatus, status}) => {
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(
        Math.max(Number(limit) || 10, 1),
        100
    );
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};

    if (orderNumber) {
        filter.orderNumber = orderNumber;
    }
    if (paymentStatus) {
        filter.paymentStatus = paymentStatus;
    }

    if (status) {
        filter.status = status;
    }

    const [orders, total] = await Promise.all([
        orderRepository.getPaginateOrders({skip, limit: limitNumber, filter }),
        orderRepository.getTotalOrderCount(filter),
    ]);
    const totalPages = Math.ceil(total / limitNumber);

    return {
        data: orders,
        pagination: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasPrev: pageNumber > 1,
            hasNext: pageNumber < totalPages,
        }
    }
}


const getNextSequence = async (sequenceName) => {
    const counter = await Counter.findByIdAndUpdate(
        sequenceName,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
};

exports.createOrder = async (userId, body) => {
    let orderItems = [];

    // 1. Start MongoDB Session and Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Checkout strictly from user's active cart
        const cartItems = await cartRepository.getAllCarts(userId);
        if (!cartItems || cartItems.length === 0) {
            throw createError("Your cart is empty. Add products to cart first.", 400);
        }

        //fetch all cart data

        const productIds = [...new Set(cartItems.map(item => item.product.toString()))];

        const products = await productRepository.getProductsWithIds(productIds)
        //console.log(products)
        //return products;
        for (const item of cartItems) {
            const product = products.find(product => product._id.toString() === item.product.toString());
            console.log(product);
            if (!product) {
                throw createError(`Product not found for a cart item`, 404);
            }

            const variant = product.variants.find(
                (v) => v._id.toString() === item.variantId.toString()
            );
            if (!variant) {
                throw createError(
                    `Variant not found for product "${product.name}" in cart`,
                    404
                );
            }

            if (variant.stock < item.quantity) {
                throw createError(
                    `Insufficient stock for product "${product.name}" (SKU: ${variant.sku}) in cart. Available stock: ${variant.stock}`,
                    400
                );
            }

            //generate variant name with size & color
            let variantNameParts = [];
            if (variant.color) variantNameParts.push(variant.color);
            if (variant.size) variantNameParts.push(variant.size);
            const variantName = variantNameParts.length > 0 ? variantNameParts.join(" / ") : "Standard";

            //order item
            orderItems.push({
                productId: product._id,
                variantId: variant._id,
                productName: product.name,
                variantName,
                sku: variant.sku,
                image: variant.images && variant.images.length > 0 ? variant.images[0] : null,
                quantity: item.quantity,
                unitPrice: variant.price,
                totalPrice: variant.price * item.quantity,
            });

            // Pass the session to the repository update method
            await productRepository.updateVariantById(variant._id, { stock: variant.stock - item.quantity }, { session });
        }

        const subtotal = orderItems.reduce((acc, item) => acc + item.totalPrice, 0);
        const discount = body.discount || 0;
        const deliveryCharge = body.deliveryCharge || 0;
        const total = Math.max(0, subtotal - discount + deliveryCharge);

        // We do not pass session here so sequence generation doesn't block other transactions
        const orderSeq = await getNextSequence("order_sequence");
        const paymentSeq = await getNextSequence("payment_sequence");

        const orderNumber = `ORD-${String(orderSeq).padStart(5, "0")}`;
        const paymentNumber = `PAY-${String(paymentSeq).padStart(5, "0")}`;

        // Create Order
        const orderPayload = {
            user: userId,
            orderNumber,
            items: orderItems,
            shippingAddress: body.shippingAddress,
            paymentMethod: body.paymentMethod,
            subtotal,
            discount,
            deliveryCharge,
            total,
            paymentStatus: "PENDING",
            status: "PENDING",
        };
        // Pass session to repository
        const order = await orderRepository.createOrder(orderPayload, { session });

        // Create Payment
        const paymentPayload = {
            paymentNumber,
            order: order._id,
            user: userId,
            amount: total,
            paymentMethod: body.paymentMethod,
            paymentStatus: "PENDING",
        };

        const payment = await paymentRepository.createPayment(paymentPayload, { session });

        // Clear cart since checkout was successful
        await cartRepository.clearCartByUserId(userId, { session });

        // ommit Transaction (Everything succeeded!)
        await session.commitTransaction();
        session.endSession();

        return { order, payment };
    } catch (error) {
        // Rollback Transaction (Something failed!)
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
