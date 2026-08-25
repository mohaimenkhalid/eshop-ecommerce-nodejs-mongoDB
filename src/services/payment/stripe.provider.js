const Stripe = require("stripe");
const stripeConfig = require("../../config/stripe.config");

// Currencies Stripe expects in whole units instead of the usual 1/100.
const ZERO_DECIMAL_CURRENCIES = new Set([
    "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw",
    "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

// Stripe substitutes the real session id for this placeholder in success_url,
// which is how the return handler knows which session to verify.
const SESSION_ID_PLACEHOLDER = "{CHECKOUT_SESSION_ID}";

class StripeProvider {
    constructor() {
        stripeConfig.assertConfigured();
        this.config = stripeConfig;
        this.client = new Stripe(stripeConfig.secretKey);
    }

    // Stripe charges in the smallest currency unit.
    toMinorUnit(amount, currency = this.config.currency) {
        if (ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase())) {
            return Math.round(amount);
        }
        return Math.round(amount * 100);
    }

    // Without the placeholder the customer comes back with no session id and
    // the payment can never be verified, so add it if it is missing.
    successUrlWithSessionId() {
        const url = this.config.successUrl;
        if (url.includes(SESSION_ID_PLACEHOLDER)) {
            return url;
        }

        return `${url}${url.includes("?") ? "&" : "?"}session_id=${SESSION_ID_PLACEHOLDER}`;
    }

    // One line item for the whole order total. Per-item lines would have to
    // reproduce discount and deliveryCharge exactly, and any rounding drift
    // there means Stripe charges something other than order.total.
    createCheckoutSession({ order, customerEmail }) {
        const currency = this.config.currency;

        return this.client.checkout.sessions.create({
            mode: "payment",
            customer_email: customerEmail || undefined,
            client_reference_id: order.orderNumber,
            success_url: this.successUrlWithSessionId(),
            cancel_url: this.config.cancelUrl,
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency,
                        unit_amount: this.toMinorUnit(order.total, currency),
                        product_data: {
                            name: `Order ${order.orderNumber}`,
                            description: `${order.items.length} item(s)`,
                        },
                    },
                },
            ],
            // Read back on return to find the local order.
            metadata: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
            },
        });
    }

    retrieveSession(sessionId) {
        return this.client.checkout.sessions.retrieve(sessionId);
    }
}

module.exports = StripeProvider;
