const paymentConfig = require("../config/payment.config");
const createPaymentProvider = require("./payment/provider.factory");
const orderRepository = require("../repositories/order.repository");
const paymentRepository = require("../repositories/payment.repository");
const createError = require("../utils/createError");
const { enqueueInvoiceEmail } = require("../queues/invoiceEmail.queue");

// Built on first use rather than at require time, so the app still boots when
// Stripe env vars are missing (COD-only deployments).
let provider = null;
const getProvider = () => {
    if (!paymentConfig.isEnabled) {
        throw createError("Online payment is not configured on this server", 503);
    }

    if (!provider) {
        provider = createPaymentProvider(paymentConfig.driver);
    }
    return provider;
};

// Step 1: hand the customer a Stripe-hosted payment page for an existing order.
exports.createCheckoutSession = async (userId, orderId) => {
    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
        throw createError("Order not found", 404);
    }

    // getOrderById populates user, so compare against the populated _id.
    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    if (orderUserId !== userId.toString()) {
        throw createError("You do not have permission for this action", 403);
    }

    if (order.paymentMethod !== "STRIPE") {
        throw createError(
            `Order ${order.orderNumber} is a ${order.paymentMethod} order, not a Stripe order`,
            409
        );
    }

    if (order.paymentStatus === "PAID") {
        throw createError(`Order ${order.orderNumber} is already paid`, 409);
    }

    const session = await getProvider().createCheckoutSession({
        order,
        customerEmail: order.user?.email,
    });

    // Kept so the return handler can verify the payment even if the customer
    // comes back without a session id in the URL.
    await paymentRepository.updatePaymentByOrderId(orderId, {
        gatewayReference: session.id,
    });

    return {
        sessionId: session.id,
        url: session.url,
    };
};

// The return route has no auth guard (the customer arrives straight from
// Stripe), so the response carries only what a receipt needs — never the
// populated user.
const receipt = (order) => ({
    orderId: order._id,
    orderNumber: order.orderNumber,
    total: order.total,
    paymentStatus: order.paymentStatus,
    status: order.status,
});

// The single place that turns a Stripe-confirmed session into a paid order.
// Called from every path that can discover the payment succeeded, so all of
// them behave identically.
const applyPaidSession = async (order, session) => {
    const paidAt = new Date();

    const payment = await paymentRepository.updatePaymentByOrderId(order._id, {
        paymentStatus: "SUCCESS",
        transactionId:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
        gatewayReference: session.id,
        paidAt,
    });

    // Read the updated order back, so callers see what was written rather than
    // the snapshot taken before the update.
    const paidOrder = await orderRepository.updateOrderById(order._id, {
        paymentStatus: "PAID",
        status: "CONFIRMED",
    });

    // Same invoice mail a manual CONFIRMED transition sends.
    try {
        await enqueueInvoiceEmail({ orderId: order._id.toString() });
    } catch (queueError) {
        console.error("Failed to enqueue invoice email:", queueError.message);
    }

    console.log(`💰 order ${order.orderNumber} marked PAID via Stripe`);

    return { paidOrder, payment };
};

// Ask Stripe about an order's outstanding session and apply whatever it says.
// This is what makes the flow self-healing: the browser redirect is only the
// fastest path here, not the only one. A customer who paid and then closed the
// tab is reconciled the next time anyone reads this order's payment.
const syncOrderWithStripe = async (order) => {
    if (order.paymentMethod !== "STRIPE" || order.paymentStatus === "PAID") {
        return { order, changed: false };
    }

    const payment = await paymentRepository.getPaymentByOrderId(order._id);
    if (!payment?.gatewayReference) {
        // No checkout session was ever created, so there is nothing to reconcile.
        return { order, changed: false };
    }

    let session;
    try {
        session = await getProvider().retrieveSession(payment.gatewayReference);
    } catch (error) {
        // Stripe unreachable or an unknown session: report the order as it
        // stands rather than failing the read.
        console.error(
            `Could not reach Stripe for session ${payment.gatewayReference}:`,
            error.message
        );
        return { order, changed: false, syncFailed: true };
    }

    if (session.payment_status === "paid") {
        const { paidOrder } = await applyPaidSession(order, session);
        return { order: paidOrder, changed: true };
    }

    // Unpaid and the session is dead, so the customer needs a fresh one.
    // Nothing is written: the order stays PENDING and payable on retry.
    return {
        order,
        changed: false,
        expired: session.status === "expired",
    };
};

// Step 2: the customer is back from Checkout. Never trust the redirect itself —
// ask Stripe what actually happened before touching the order.
exports.confirmCheckoutSession = async (sessionId) => {
    const session = await getProvider().retrieveSession(sessionId);

    const orderId = session.metadata?.orderId;
    if (!orderId) {
        throw createError("This checkout session is not linked to an order", 400);
    }

    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
        throw createError("Order not found", 404);
    }

    // Already handled by an earlier visit to the success page, or by a sync.
    if (order.paymentStatus === "PAID") {
        return { paid: true, alreadyHandled: true, order: receipt(order) };
    }

    if (session.payment_status !== "paid") {
        return {
            paid: false,
            alreadyHandled: false,
            expired: session.status === "expired",
            sessionStatus: session.status,
            paymentStatus: session.payment_status,
            order: receipt(order),
        };
    }

    const { paidOrder, payment } = await applyPaidSession(order, session);

    return {
        paid: true,
        alreadyHandled: false,
        order: receipt(paidOrder),
        paymentNumber: payment?.paymentNumber,
    };
};

exports.syncOrderPayment = async (orderId, { userId, role }) => {
    const order = await orderRepository.getOrderById(orderId);
    if (!order) {
        throw createError("Order not found", 404);
    }

    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    const isPrivileged = ["ADMIN", "SUPER_ADMIN"].includes(role);
    if (!isPrivileged && orderUserId !== userId.toString()) {
        throw createError("You do not have permission for this action", 403);
    }

    const result = await syncOrderWithStripe(order);

    return {
        paid: result.order.paymentStatus === "PAID",
        changed: result.changed,
        expired: Boolean(result.expired),
        syncFailed: Boolean(result.syncFailed),
        order: receipt(result.order),
    };
};

exports.getPaymentByOrderId = async (orderId, { userId, role }) => {
    const payment = await paymentRepository.getPaymentByOrderId(orderId);
    if (!payment) {
        throw createError("Payment not found for this order", 404);
    }

    const isPrivileged = ["ADMIN", "SUPER_ADMIN"].includes(role);
    if (!isPrivileged && payment.user.toString() !== userId.toString()) {
        throw createError("You do not have permission for this action", 403);
    }

    // Reading a still-pending gateway payment reconciles it first, so a
    // customer who paid and closed the tab sees the truth here.
    if (payment.paymentStatus === "PENDING" && payment.gatewayReference) {
        const order = await orderRepository.getOrderById(orderId);
        if (order) {
            await syncOrderWithStripe(order);
            return paymentRepository.getPaymentByOrderId(orderId);
        }
    }

    return payment;
};
