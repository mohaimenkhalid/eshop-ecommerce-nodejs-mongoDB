// Maps a mail driver name to a factory that builds its provider.
// Each entry requires lazily, so only the active driver's SDK gets loaded.
const providers = {
    smtp: () => new (require("./smtp.provider"))(),
    // ses: () => new (require("./ses.provider"))(),
    // sendgrid: () => new (require("./sendgrid.provider"))(),
};

const createMailProvider = (driver) => {
    const build = providers[driver];
    if (!build) {
        throw new Error(
            `Unsupported mail driver: ${driver}. Supported drivers: ${Object.keys(providers).join(", ")}`
        );
    }

    return build();
};

module.exports = createMailProvider;
