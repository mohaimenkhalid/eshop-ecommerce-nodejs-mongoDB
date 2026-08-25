const paymentService = require("../services/payment.service");
const stripeConfig = require("../config/stripe.config");

exports.createCheckoutSession = async (req, res, next) => {
    try {
        const session = await paymentService.createCheckoutSession(
            req.user.userId,
            req.body.orderId
        );

        return res.status(201).json({
            success: true,
            message: "Checkout session created successfully",
            data: session,
        });
    } catch (error) {
        next(error);
    }
};

// Builds the URL the customer's browser lands on after verification, so they
// see a real page instead of raw JSON.
const buildRedirect = (base, params) => {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
        }
    });
    return url.toString();
};

// Where Stripe sends the customer back. No auth guard: the customer arrives
// here straight from the hosted page with no Authorization header, and the
// session id is verified against Stripe before anything is written.
exports.stripeReturn = async (req, res, next) => {
    try {
        const { session_id: sessionId } = req.query;
        const redirectBase = stripeConfig.returnRedirectUrl;

        if (!sessionId) {
            if (redirectBase) {
                return res.redirect(
                    303,
                    buildRedirect(redirectBase, { status: "error", reason: "missing_session" })
                );
            }

            return res.status(400).json({
                success: false,
                message: "session_id is required",
            });
        }

        const result = await paymentService.confirmCheckoutSession(sessionId);

        if (redirectBase) {
            return res.redirect(
                303,
                buildRedirect(redirectBase, {
                    status: result.paid ? "paid" : result.expired ? "expired" : "pending",
                    order: result.order?.orderNumber,
                    orderId: result.order?.orderId,
                })
            );
        }

        return res.status(200).json({
            success: true,
            message: result.paid
                ? "Payment confirmed, your order is being processed"
                : "Payment is not complete yet",
            data: result,
        });
    } catch (error) {
        // A broken return must still land the customer somewhere sensible.
        if (stripeConfig.returnRedirectUrl) {
            console.error("Stripe return handling failed:", error.message);
            return res.redirect(
                303,
                buildRedirect(stripeConfig.returnRedirectUrl, { status: "error" })
            );
        }

        next(error);
    }
};

// Explicit reconciliation — what a "check payment status" button calls.
exports.syncOrderPayment = async (req, res, next) => {
    try {
        const result = await paymentService.syncOrderPayment(req.params.orderId, {
            userId: req.user.userId,
            role: req.user.role,
        });

        return res.status(200).json({
            success: true,
            message: result.paid
                ? "Payment confirmed"
                : result.expired
                    ? "The payment session expired, start a new checkout"
                    : "Payment is still pending",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

exports.getPaymentByOrderId = async (req, res, next) => {
    try {
        const payment = await paymentService.getPaymentByOrderId(req.params.orderId, {
            userId: req.user.userId,
            role: req.user.role,
        });

        return res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        next(error);
    }
};
