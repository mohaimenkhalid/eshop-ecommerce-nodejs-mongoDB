require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Address = require('../models/address.model');

const argNum = (flag, fallback) => {
    const raw = process.argv.find(a => a.startsWith(`--${flag}=`));
    return raw === undefined ? fallback : Number(raw.split('=')[1]);
};

const ORDER_COUNT = argNum('count', 400);
const NEW_USER_COUNT = argNum('users', 120);
const CLEAN = process.argv.includes('--clean');

// Seeded docs carry a recognisable prefix so --clean can find them without
// touching the real orders/payments/users that already exist.
const ORDER_PREFIX = 'ORD-SEED-';
const PAYMENT_PREFIX = 'PAY-SEED-';
const SEED_EMAIL_DOMAIN = '@seed.local';

// deterministic PRNG — re-running after --clean reproduces the exact same dataset
let rngState = 2026;
const rand = () => {
    rngState = (rngState * 1103515245 + 12345) & 0x7FFFFFFF;
    return rngState / 0x7FFFFFFF;
};
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];

// picks an index with a power-law bias toward the front of the array, so a few
// customers become "power buyers" and the rest order once or twice — this is what
// makes repeat-vs-onetime and RFM reports produce meaningful segments
const pickWeighted = (arr) => {
    const r = rand() ** 3;
    return arr[Math.min(arr.length - 1, Math.floor(r * arr.length))];
};

const FIRST_NAMES = [
    "Rakib", "Tanvir", "Sadia", "Nusrat", "Imran", "Farhana", "Shakib", "Mehedi",
    "Sumaiya", "Arif", "Jubayer", "Tasnim", "Rifat", "Nafisa", "Sabbir", "Maruf",
    "Ayesha", "Rasel", "Sharmin", "Tuhin", "Mizan", "Labiba", "Ashiq", "Rumana",
    "Fahim", "Sneha", "Riyad", "Munira", "Sajib", "Anika",
];
const LAST_NAMES = [
    "Hasan", "Ahmed", "Islam", "Chowdhury", "Rahman", "Karim", "Akter", "Hossain",
    "Sarkar", "Mahmud", "Uddin", "Khan", "Alam", "Sultana", "Talukder",
];

// division → cities → areas, kept consistent so the geographic report is not nonsense
const LOCATIONS = [
    { division: "Dhaka", weight: 45, cities: [
        { city: "Dhaka", areas: ["Dhanmondi", "Mirpur", "Uttara", "Mohakhali", "Bashundhara", "Shamoly"], postal: "1207" },
        { city: "Gazipur", areas: ["Tongi", "Board Bazar"], postal: "1700" },
        { city: "Narayanganj", areas: ["Fatullah", "Siddhirganj"], postal: "1400" },
    ]},
    { division: "Chattogram", weight: 20, cities: [
        { city: "Chattogram", areas: ["Agrabad", "Khulshi", "Pahartali", "Halishahar"], postal: "4000" },
        { city: "Cox's Bazar", areas: ["Kolatoli", "Jhilongja"], postal: "4700" },
    ]},
    { division: "Sylhet", weight: 9, cities: [
        { city: "Sylhet", areas: ["Zindabazar", "Amberkhana", "Subid Bazar"], postal: "3100" },
    ]},
    { division: "Rajshahi", weight: 8, cities: [
        { city: "Rajshahi", areas: ["Shaheb Bazar", "Boalia"], postal: "6000" },
    ]},
    { division: "Khulna", weight: 7, cities: [
        { city: "Khulna", areas: ["Sonadanga", "Khalishpur"], postal: "9000" },
    ]},
    { division: "Barishal", weight: 4, cities: [
        { city: "Barishal", areas: ["Band Road", "Nathullabad"], postal: "8200" },
    ]},
    { division: "Rangpur", weight: 4, cities: [
        { city: "Rangpur", areas: ["Jahaj Company More"], postal: "5400" },
    ]},
    { division: "Mymensingh", weight: 3, cities: [
        { city: "Mymensingh", areas: ["Ganginar Par"], postal: "2200" },
    ]},
];

const LOCATION_POOL = LOCATIONS.flatMap(l => Array(l.weight).fill(l));

const pickLocation = () => {
    const division = pick(LOCATION_POOL);
    const city = pick(division.cities);
    return { division: division.division, city: city.city, area: pick(city.areas), postalCode: city.postal };
};

const DELIVERY_CHARGE = { Dhaka: 60, Chattogram: 100, default: 120 };

// weighted payment method pool — COD still dominates in BD
const PAYMENT_METHOD_POOL = [
    ...Array(40).fill("COD"),
    ...Array(25).fill("BKASH"),
    ...Array(12).fill("NAGAD"),
    ...Array(13).fill("STRIPE"),
    ...Array(10).fill("CARD"),
];

// gateway charge rates (percent of amount, plus a fixed fee)
const GATEWAY_RATE = {
    COD:    { percent: 0,    fixed: 0 },
    BKASH:  { percent: 1.85, fixed: 0 },
    NAGAD:  { percent: 1.5,  fixed: 0 },
    CARD:   { percent: 2.5,  fixed: 5 },
    STRIPE: { percent: 2.9,  fixed: 3 },
};

// order status pool with the payment status that logically goes with it
const STATUS_FLOW = [
    ...Array(50).fill({ status: "DELIVERED", paymentStatus: "PAID" }),
    ...Array(9).fill({ status: "SHIPPED",   paymentStatus: "PAID" }),
    ...Array(10).fill({ status: "CONFIRMED", paymentStatus: "PAID" }),
    ...Array(13).fill({ status: "PENDING",   paymentStatus: "PENDING" }),
    ...Array(10).fill({ status: "CANCELLED", paymentStatus: "PENDING" }),
    ...Array(5).fill({ status: "CANCELLED",  paymentStatus: "REFUNDED" }),
    ...Array(3).fill({ status: "PENDING",    paymentStatus: "FAILED" }),
];

const ORDER_PAYMENT_TO_PAYMENT_STATUS = {
    PAID: "SUCCESS",
    PENDING: "PENDING",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED",
};

const round2 = (n) => Math.round(n * 100) / 100;

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce');

    if (CLEAN) {
        const seedUsers = await User.find({ email: new RegExp(`${SEED_EMAIL_DOMAIN}$`) }).select('_id').lean();
        const seedUserIds = seedUsers.map(x => x._id);

        const [o, p, addrRes, userRes] = await Promise.all([
            Order.deleteMany({ orderNumber: new RegExp(`^${ORDER_PREFIX}`) }),
            Payment.deleteMany({ paymentNumber: new RegExp(`^${PAYMENT_PREFIX}`) }),
            Address.deleteMany({ user: { $in: seedUserIds } }),
            User.deleteMany({ _id: { $in: seedUserIds } }),
        ]);
        console.log(`🧹 Cleaned — orders: ${o.deletedCount}, payments: ${p.deletedCount}, addresses: ${addrRes.deletedCount}, users: ${userRes.deletedCount}`);
    }

    // ---- customers ----
    let customers = await User.find({ role: "USER", isDeleted: false }).select('_id name').lean();

    if (NEW_USER_COUNT > 0) {
        // one hash reused for every seeded user — bcrypt per user would be slow and
        // pointless for throwaway data. Login password: Seed@1234
        const passwordHash = await bcrypt.hash("Seed@1234", 10);
        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;

        const userDocs = [];
        for (let i = 1; i <= NEW_USER_COUNT; i++) {
            const first = pick(FIRST_NAMES);
            const last = pick(LAST_NAMES);
            // registration spread over 400 days so the cohort report has real cohorts
            const createdAt = new Date(now - randInt(30, 400) * DAY);
            userDocs.push({
                name: `${first} ${last}`,
                email: `${first.toLowerCase()}.${last.toLowerCase()}.${i}${SEED_EMAIL_DOMAIN}`,
                phone: `018${String(10000000 + i * 137).slice(0, 8)}`,
                password: passwordHash,
                role: "USER",
                status: rand() < 0.95 ? "ACTIVE" : "INACTIVE",
                isDeleted: false,
                createdAt,
                updatedAt: createdAt,
            });
        }
        const newUsers = await User.insertMany(userDocs, { timestamps: false, ordered: false });
        console.log(`👤 Created ${newUsers.length} customers (password: Seed@1234)`);

        // a default address each — needed by the customer detail report
        const addressDocs = newUsers.map(u => {
            const loc = pickLocation();
            return {
                user: u._id,
                receiverName: u.name,
                receiverPhone: u.phone,
                addressLine: `House ${randInt(1, 120)}, Road ${randInt(1, 25)}`,
                area: loc.area,
                city: loc.city,
                division: loc.division,
                postalCode: loc.postalCode,
                country: "Bangladesh",
                addressType: pick(["HOME", "HOME", "OFFICE", "OTHER"]),
                isDefault: true,
                isDeleted: false,
            };
        });
        await Address.insertMany(addressDocs, { ordered: false });
        console.log(`📍 Created ${addressDocs.length} addresses`);

        customers = await User.find({ role: "USER", isDeleted: false }).select('_id name').lean();
    }

    if (!customers.length) throw new Error('No customer found. Run with --users=40 to create some.');

    // ---- products to order from ----
    const products = await Product.find({ isDeleted: false })
        .select('name variants status')
        .lean();
    const orderable = products.filter(p => p.variants?.length);
    if (!orderable.length) throw new Error('No product with variants found. Run seed-products.js first.');

    console.log(`🛒 Building ${ORDER_COUNT} orders from ${orderable.length} products and ${customers.length} customers`);

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const orderDocs = [];
    const paymentDocs = [];
    let mismatchCount = 0;

    for (let i = 1; i <= ORDER_COUNT; i++) {
        const customer = pickWeighted(customers);
        const loc = pickLocation();

        // 1-4 distinct product+variant lines, most orders being a single line
        const itemCount = pick([1, 1, 1, 1, 2, 2, 2, 3, 3, 4]);
        const items = [];
        const usedVariants = new Set();

        for (let j = 0; j < itemCount; j++) {
            const product = pick(orderable);
            const variant = pick(product.variants);
            const key = String(variant._id);
            if (usedVariants.has(key)) continue;
            usedVariants.add(key);

            const quantity = pick([1, 1, 1, 1, 1, 2, 2, 2, 3, 4]);
            const variantName = [variant.color, variant.size].filter(Boolean).join(" / ") || "Standard";

            items.push({
                productId: product._id,
                variantId: variant._id,
                productName: product.name,
                variantName,
                sku: variant.sku,
                image: variant.images?.[0] ?? null,
                quantity,
                unitPrice: variant.price,
                totalPrice: variant.price * quantity,
            });
        }
        if (!items.length) continue;

        const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
        // ~30% of orders get a discount
        const discount = rand() < 0.3 ? Math.round(subtotal * (randInt(3, 15) / 100)) : 0;
        const deliveryCharge = DELIVERY_CHARGE[loc.division] ?? DELIVERY_CHARGE.default;
        const total = Math.max(0, subtotal - discount + deliveryCharge);

        let { status, paymentStatus } = pick(STATUS_FLOW);
        const paymentMethod = pick(PAYMENT_METHOD_POOL);

        // COD is only PAID once delivered — prepaid methods are PAID up front
        if (paymentMethod === "COD" && status !== "DELIVERED" && paymentStatus === "PAID") {
            paymentStatus = "PENDING";
        }

        // growth curve: skew createdAt toward recent months so the month-over-month
        // growth report actually shows growth instead of noise
        const daysAgo = Math.floor((rand() ** 1.35) * 364);
        // evening-heavy hours (Asia/Dhaka) for the hour-of-day heat map
        const hourPool = [10, 11, 12, 13, 14, 15, 16, 17, 20, 20, 21, 21, 21, 22, 22, 23, 9, 19, 19, 18, 18, 18];
        const localHour = pick(hourPool);
        const createdAt = new Date(now - daysAgo * DAY);
        createdAt.setUTCHours(localHour - 6, randInt(0, 59), randInt(0, 59), 0); // Dhaka = UTC+6

        const orderNumber = `${ORDER_PREFIX}${String(i).padStart(5, "0")}`;

        orderDocs.push({
            user: customer._id,
            orderNumber,
            items,
            shippingAddress: {
                receiverName: customer.name,
                receiverPhone: `018${String(20000000 + i * 91).slice(0, 8)}`,
                addressLine: `House ${randInt(1, 120)}, Road ${randInt(1, 25)}`,
                area: loc.area,
                city: loc.city,
                division: loc.division,
                postalCode: loc.postalCode,
                country: "Bangladesh",
            },
            paymentMethod,
            paymentStatus,
            status,
            subtotal,
            discount,
            deliveryCharge,
            total,
            createdAt,
            updatedAt: createdAt,
        });

        // ---- matching payment ----
        const rate = GATEWAY_RATE[paymentMethod];
        let paymentAmount = total;
        let paymentStatusMapped = ORDER_PAYMENT_TO_PAYMENT_STATUS[paymentStatus];

        // deliberately break ~1.5% of records so the reconciliation report has
        // something real to catch. Remove this block if you want clean data.
        const broken = rand() < 0.015;
        if (broken) {
            mismatchCount++;
            if (rand() < 0.5) paymentAmount = total + randInt(50, 500);   // amount mismatch
            else paymentStatusMapped = "SUCCESS";                          // paid in gateway, order still pending
        }

        const gatewayCharge = paymentStatusMapped === "SUCCESS"
            ? round2(paymentAmount * (rate.percent / 100) + rate.fixed)
            : 0;

        // paid a few minutes to a few hours after the order
        const paidAt = paymentStatusMapped === "SUCCESS"
            ? new Date(createdAt.getTime() + randInt(2, 600) * 60 * 1000)
            : null;

        const payment = {
            paymentNumber: `${PAYMENT_PREFIX}${String(i).padStart(5, "0")}`,
            orderNumber,   // temporary — swapped for the real _id after orders are inserted
            user: customer._id,
            amount: paymentAmount,
            paymentMethod,
            gatewayCharge,
            paymentStatus: paymentStatusMapped,
            paidAt,
            createdAt,
            updatedAt: paidAt ?? createdAt,
        };

        if (paymentMethod !== "COD") {
            payment.transactionId = `TXN${String(i).padStart(6, "0")}${randInt(100, 999)}`;
        }
        // The DB has a unique+sparse index on gatewayReference, and a sparse index
        // treats an explicit null as a value — so the field is left out entirely
        // rather than set to null, otherwise the second COD payment collides.
        if (["STRIPE", "CARD"].includes(paymentMethod)) {
            payment.gatewayReference = `cs_test_seed_${i}`;
        }

        paymentDocs.push(payment);
    }

    const insertedOrders = await Order.insertMany(orderDocs, { timestamps: false, ordered: false });
    console.log(`\n✅ Inserted ${insertedOrders.length} orders`);

    const orderIdByNumber = new Map(insertedOrders.map(o => [o.orderNumber, o._id]));
    const finalPayments = paymentDocs.map(({ orderNumber, ...rest }) => ({
        ...rest,
        order: orderIdByNumber.get(orderNumber),
    })).filter(p => p.order);

    // Raw driver insert on purpose: the Payment schema declares
    // `gatewayReference: { default: null }`, but the collection carries a
    // unique+sparse index on that field. Going through mongoose would apply the
    // null default to every COD payment and the second one would collide.
    let insertedCount = 0;
    try {
        const res = await Payment.collection.insertMany(finalPayments, { ordered: false });
        insertedCount = res.insertedCount;
    } catch (e) {
        // roll back the orders we just created so no order is left without a payment
        await Order.deleteMany({ orderNumber: new RegExp(`^${ORDER_PREFIX}`) });
        throw new Error(`Payment insert failed (orders rolled back): ${e.message}`);
    }
    console.log(`✅ Inserted ${insertedCount} payments (${mismatchCount} deliberately inconsistent)`);

    await printSummary();
    await mongoose.disconnect();
};

const printSummary = async () => {
    const [byStatus, byMethod, revenue, monthly, repeat] = await Promise.all([
        Order.aggregate([
            { $group: { _id: "$status", orders: { $sum: 1 }, amount: { $sum: "$total" } } },
            { $sort: { orders: -1 } },
        ]),
        Order.aggregate([
            { $group: { _id: "$paymentMethod", orders: { $sum: 1 } } },
            { $sort: { orders: -1 } },
        ]),
        Order.aggregate([
            { $match: { paymentStatus: "PAID" } },
            { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 }, aov: { $avg: "$total" } } },
        ]),
        Order.aggregate([
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "Asia/Dhaka" } }, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]),
        Order.aggregate([
            { $group: { _id: "$user", n: { $sum: 1 } } },
            { $group: { _id: { $cond: [{ $gt: ["$n", 1] }, "REPEAT", "ONE_TIME"] }, customers: { $sum: 1 } } },
        ]),
    ]);

    const r = revenue[0] ?? {};
    console.log('\n--- Order status ---');
    byStatus.forEach(s => console.log(`  ${s._id.padEnd(10)} ${String(s.orders).padStart(4)} orders   ৳${s.amount.toLocaleString('en-US')}`));
    console.log('\n--- Payment method ---');
    byMethod.forEach(s => console.log(`  ${s._id.padEnd(8)} ${String(s.orders).padStart(4)}`));
    console.log('\n--- Revenue (paymentStatus = PAID) ---');
    console.log(`  Revenue : ৳${(r.revenue ?? 0).toLocaleString('en-US')}`);
    console.log(`  Orders  : ${r.orders ?? 0}`);
    console.log(`  AOV     : ৳${Math.round(r.aov ?? 0).toLocaleString('en-US')}`);
    console.log('\n--- Orders per month ---');
    monthly.forEach(m => console.log(`  ${m._id}: ${'#'.repeat(Math.ceil(m.orders / 2))} ${m.orders}`));
    console.log('\n--- Customers ---');
    repeat.forEach(x => console.log(`  ${x._id.padEnd(9)}: ${x.customers}`));
};

seed().catch(async (e) => {
    console.error('❌ Seed failed:', e.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});

// node src/scripts/seed-orders.js
// node src/scripts/seed-orders.js --count=800 --users=60
// node src/scripts/seed-orders.js --users=0        (use existing customers only)
// node src/scripts/seed-orders.js --clean          (remove old seed, then insert fresh)
