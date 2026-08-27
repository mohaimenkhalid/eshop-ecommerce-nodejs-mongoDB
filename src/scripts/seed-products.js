require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Brand = require('../models/brand.model');
const Shop = require('../models/shop.model');
const generateSlug = require('../utils/slugify');

const TOTAL = Number(process.argv.find(a => a.startsWith('--count='))?.split('=')[1]) || 100;
const CLEAN = process.argv.includes('--clean');

// seeded products get a "-fake-<n>" slug suffix so --clean can find them again
const FAKE_SLUG_REGEX = /-fake-\d+$/;

// deterministic PRNG — same seed always produces the same dataset, so re-running
// after a --clean gives you identical data to compare reports against
let rngState = 42;
const rand = () => {
    rngState = (rngState * 1103515245 + 12345) & 0x7FFFFFFF;
    return rngState / 0x7FFFFFFF;
};
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const pickSome = (arr, n) => {
    const copy = [...arr];
    const out = [];
    for (let i = 0; i < n && copy.length; i++) {
        out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
    }
    return out;
};

const PRODUCT_LINES = [
    "UltraSharp Monitor", "ProView Display", "VisionMax Monitor", "ClearLine Display",
    "EdgeView Monitor", "TrueColor Display", "PixelPro Monitor", "SpectraView Display",
    "FocusLine Monitor", "OptiClear Display", "NovaView Monitor", "PrimeSight Display",
    "CrystalEdge Monitor", "SharpCast Display", "LuminaView Monitor", "ZenPanel Display",
    "AeroView Monitor", "SwiftScreen Display", "CoreVision Monitor", "MaxPixel Display",
];

const SERIES = ["S", "P", "E", "U", "X"];
const SIZES = ['21.5"', '24"', '27"', '32"', '34"'];
const COLORS = ["Black", "Silver", "Space Gray", "White"];
const PANEL_SIZES = ["IPS", "VA", "TN", "OLED"];

const buildDescription = (name, size) =>
    `${name} ${size} panel with slim bezel design, adjustable stand and multiple ` +
    `connectivity options. Suitable for office, gaming and creative work.`;

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce');

    const [categories, brands, shops] = await Promise.all([
        Category.find({ isDeleted: false }).select('_id name').lean(),
        Brand.find({ isDeleted: false }).select('_id name').lean(),
        Shop.find({ isDeleted: false, status: 'ACTIVE' }).select('_id name').lean(),
    ]);

    if (!categories.length) throw new Error('No category found. Create categories first.');
    if (!brands.length) throw new Error('No brand found. Create brands first.');
    if (!shops.length) throw new Error('No active shop found. Create shops first.');

    console.log(`Using ${categories.length} categories, ${brands.length} brands, ${shops.length} shops`);

    if (CLEAN) {
        const existing = await Product.find({ slug: FAKE_SLUG_REGEX }).select('_id').lean();
        if (existing.length) {
            const res = await Product.deleteMany({ slug: FAKE_SLUG_REGEX });
            console.log(`🧹 Removed ${res.deletedCount} previously seeded products`);
        } else {
            console.log('🧹 Nothing to clean');
        }
    }

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const docs = [];

    for (let i = 1; i <= TOTAL; i++) {
        const line = PRODUCT_LINES[i % PRODUCT_LINES.length];
        const size = pick(SIZES);
        const name = `${line} ${pick(SERIES)}${randInt(10, 99)} ${size}`;
        const slug = `${generateSlug(name)}-fake-${i}`;

        // 1-4 variants per product, each a unique color+size combo
        const variantCount = randInt(1, 4);
        const chosenColors = pickSome(COLORS, variantCount);
        const basePrice = randInt(9, 95) * 1000;

        const variants = chosenColors.map((color, vIndex) => {
            // ~8% of variants out of stock, ~15% low stock — feeds the low-stock report
            const roll = rand();
            let stock;
            if (roll < 0.08) stock = 0;
            else if (roll < 0.23) stock = randInt(1, 9);
            else stock = randInt(15, 150);

            return {
                sku: `MON-${String(i).padStart(3, '0')}-${vIndex + 1}`,
                color,
                size: `${size} ${pick(PANEL_SIZES)}`,
                price: basePrice + vIndex * randInt(1, 5) * 500,
                stock,
                images: [],
            };
        });

        // spread createdAt over the last 365 days so trend / cohort reports have data
        const createdAt = new Date(now - randInt(0, 364) * DAY - randInt(0, 86399) * 1000);

        docs.push({
            shop: pick(shops)._id,
            name,
            slug,
            description: buildDescription(name, size),
            category: pick(categories)._id,
            brand: pick(brands)._id,
            variants,
            isFeatured: rand() < 0.2,                 // ~20% featured
            status: rand() < 0.85 ? 'ACTIVE' : 'INACTIVE',
            isDeleted: rand() < 0.05,                 // ~5% soft deleted
            createdAt,
            updatedAt: createdAt,
        });
    }

    // timestamps: false keeps our own createdAt instead of overwriting with "now"
    const inserted = await Product.insertMany(docs, { timestamps: false, ordered: false });
    console.log(`\n✅ Inserted ${inserted.length} products`);

    const [total, active, deleted, featured, variantStats] = await Promise.all([
        Product.countDocuments(),
        Product.countDocuments({ status: 'ACTIVE', isDeleted: false }),
        Product.countDocuments({ isDeleted: true }),
        Product.countDocuments({ isFeatured: true }),
        Product.aggregate([
            { $unwind: '$variants' },
            { $group: {
                _id: null,
                variants: { $sum: 1 },
                outOfStock: { $sum: { $cond: [{ $eq: ['$variants.stock', 0] }, 1, 0] } },
                lowStock: { $sum: { $cond: [{ $lt: ['$variants.stock', 10] }, 1, 0] } },
                stockValue: { $sum: { $multiply: ['$variants.stock', '$variants.price'] } },
            }},
        ]),
    ]);

    const v = variantStats[0] || {};
    console.log('\n--- Database summary ---');
    console.log(`  Products total     : ${total}`);
    console.log(`  Active (not deleted): ${active}`);
    console.log(`  Soft deleted       : ${deleted}`);
    console.log(`  Featured           : ${featured}`);
    console.log(`  Variants total     : ${v.variants ?? 0}`);
    console.log(`  Out of stock       : ${v.outOfStock ?? 0}`);
    console.log(`  Low stock (<10)    : ${v.lowStock ?? 0}`);
    console.log(`  Stock value        : ৳${(v.stockValue ?? 0).toLocaleString('en-US')}`);

    await mongoose.disconnect();
};

seed().catch(async (e) => {
    console.error('❌ Seed failed:', e.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});

// node src/scripts/seed-products.js
// node src/scripts/seed-products.js --count=250
// node src/scripts/seed-products.js --clean          (remove old seed, then insert fresh)
