// Maps a payment driver name to a factory that builds its provider.
// Each entry requires lazily, so only the active driver's SDK gets loaded.
const providers = {
    stripe: () => new (require("./stripe.provider"))(),
    // sslcommerz: () => new (require("./sslcommerz.provider"))(),
    // bkash: () => new (require("./bkash.provider"))(),
};

const createPaymentProvider = (driver) => {
    const build = providers[driver];
    if (!build) {
        throw new Error(
            `Unsupported payment driver: ${driver}. Supported drivers: ${Object.keys(providers).join(", ")}`
        );
    }

    return build();
};

module.exports = createPaymentProvider;
