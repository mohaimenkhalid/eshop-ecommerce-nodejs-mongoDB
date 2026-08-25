const stripeConfig = {
    secretKey: process.env.STRIPE_SECRET_KEY,
    currency: (process.env.STRIPE_CURRENCY || "usd").toLowerCase(),
    successUrl: process.env.STRIPE_SUCCESS_URL,
    cancelUrl: process.env.STRIPE_CANCEL_URL,
    // Where to send the customer's browser after the payment is verified. Left
    // unset, the return route answers with JSON instead (handy in dev / for a
    // pure API client).
    returnRedirectUrl: process.env.PAYMENT_RETURN_REDIRECT_URL || null,
};

// Fail fast at boot rather than at the first checkout attempt.
stripeConfig.assertConfigured = () => {
    if (!stripeConfig.secretKey) {
        throw new Error("Stripe is not configured. Missing env: STRIPE_SECRET_KEY");
    }

    if (!stripeConfig.successUrl || !stripeConfig.cancelUrl) {
        throw new Error(
            "Stripe is not configured. Missing env: STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL"
        );
    }
};

module.exports = stripeConfig;
