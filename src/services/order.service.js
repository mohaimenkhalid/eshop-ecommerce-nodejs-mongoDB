const orderRepository = require("../repositories/order.repository");
const paymentRepository = require("../repositories/payment.repository");
const productRepository = require("../repositories/product.repository");
const cartRepository = require("../repositories/cart.repository");
const createError = require("../utils/createError");
const Counter = require("../models/counter.model");

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

    // Checkout strictly from user's active cart
    const cartItems = await cartRepository.getAllCarts(userId);
    if (!cartItems || cartItems.length === 0) {
        throw createError("Your cart is empty. Add products to cart first.", 400);
    }

    for (const item of cartItems) {
        const product = await productRepository.getProductById(item.product);
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

        let variantNameParts = [];
        if (variant.color) variantNameParts.push(variant.color);
        if (variant.size) variantNameParts.push(variant.size);
        const variantName = variantNameParts.length > 0 ? variantNameParts.join(" / ") : "Standard";

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

        // Decrement variant stock
        variant.stock -= item.quantity;
        await productRepository.update(product._id, { variants: product.variants });
    }

    // 2. Calculations
    const subtotal = orderItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const discount = body.discount || 0;
    const deliveryCharge = body.deliveryCharge || 0;
    const total = Math.max(0, subtotal - discount + deliveryCharge);

    // 3. Document identification numbers
    const orderSeq = await getNextSequence("order_sequence");
    const paymentSeq = await getNextSequence("payment_sequence");

    const orderNumber = `ORD-${String(orderSeq).padStart(5, "0")}`;
    const paymentNumber = `PAY-${String(paymentSeq).padStart(5, "0")}`;

    // 4. Create Order
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
    const order = await orderRepository.createOrder(orderPayload);

    // 5. Create Payment
    const paymentPayload = {
        paymentNumber,
        order: order._id,
        user: userId,
        amount: total,
        paymentMethod: body.paymentMethod,
        paymentStatus: "PENDING",
    };
    const payment = await paymentRepository.createPayment(paymentPayload);

    // 6. Clear cart since checkout was successful
    await cartRepository.clearCartByUserId(userId);

    return { order, payment };
};
