const express = require("express");
const router = express.Router();
const authGuard = require("../middlewares/authGuard.middleware");
const validateRequest = require("../middlewares/validateRequest.middleware");
const { createCheckoutSessionSchema } = require("../validations/payment.validation");
const paymentController = require("../controllers/paymentController");

router.post(
    "/stripe/checkout-session",
    authGuard,
    validateRequest(createCheckoutSessionSchema),
    paymentController.createCheckoutSession
);

// Stripe's success_url points here, so it cannot require a token.
router.get("/stripe/return", paymentController.stripeReturn);

router.get("/order/:orderId", authGuard, paymentController.getPaymentByOrderId);

// On-demand reconciliation, for a "check payment status" button.
router.post("/order/:orderId/sync", authGuard, paymentController.syncOrderPayment);

module.exports = router;
