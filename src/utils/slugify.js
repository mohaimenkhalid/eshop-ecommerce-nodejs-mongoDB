const slugify = require("slugify");

const generateSlug = (text) =>
    slugify(text, {
        lower: true,
        strict: true,
    });

module.exports = generateSlug;