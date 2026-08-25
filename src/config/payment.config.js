// Stripe stays opt-in: the driver is only active when PAYMENT_DRIVER names it
// explicitly, or when Stripe credentials are present. An install that has
// neither keeps booting as a COD-only shop.
const explicitDriver = process.env.PAYMENT_DRIVER;

const driver =
    explicitDriver ||
    (process.env.STRIPE_SECRET_KEY ? "stripe" : "none");

module.exports = {
    driver,
    // Only an explicit PAYMENT_DRIVER makes a misconfiguration fatal at boot.
    isExplicit: Boolean(explicitDriver),
    isEnabled: driver !== "none",
};
