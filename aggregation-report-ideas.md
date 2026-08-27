# Aggregation শেখার জন্য Report আইডিয়া

উদ্দেশ্য: report বানাতে বানাতে MongoDB aggregation pipeline শেখা।

নিচের report গুলো **সহজ থেকে কঠিন** ক্রমে সাজানো। প্রতিটার সাথে লেখা আছে —
কোন collection লাগবে, কোন operator শিখবেন, আর pipeline-টা মোটামুটি কেমন হবে।

উপরের level শেষ না করে নিচে যাবেন না — কারণ পরের গুলো আগের operator-এর উপর দাঁড়ানো।

---

## আপনার Schema-তে যা আছে (দ্রুত রেফারেন্স)

| Collection | কাজে লাগবে যেসব ফিল্ড |
|---|---|
| `orders` | `user`, `items[]` (array), `status`, `paymentStatus`, `paymentMethod`, `subtotal`, `discount`, `deliveryCharge`, `total`, `shippingAddress.{city,division}`, `createdAt` |
| `orders.items[]` | `productId`, `variantId`, `productName`, `sku`, `quantity`, `unitPrice`, `totalPrice` |
| `products` | `shop`, `category`, `brand`, `variants[]` (array), `status`, `isDeleted` |
| `products.variants[]` | `sku`, `color`, `size`, `price`, `stock` |
| `payments` | `order`, `user`, `amount`, `paymentMethod`, `gatewayCharge`, `paymentStatus`, `paidAt` |
| `users` | `role`, `status`, `isDeleted`, `createdAt` |
| `shops` | `owner`, `status`, `isFeatured` |
| `carts` | `user`, `product`, `variantId`, `quantity` |
| `categories` | `parentCategory` (নিজের দিকেই ref — tree!) |
| `addresses` | `city`, `division`, `area`, `addressType` |

**দুইটা গুরুত্বপূর্ণ পয়েন্ট:**

1. `orders.items[]` হলো **snapshot** — অর্ডারের সময়ের নাম/দাম ওখানেই সেভ থাকে।
   তাই product-wise sales report-এ `$lookup` না করেও কাজ চালানো যায়। কিন্তু
   category/brand/shop-wise report-এ `$lookup` লাগবে, কারণ ওগুলো snapshot-এ নাই।
2. `categories.parentCategory` নিজের collection-কেই ref করে — এটা `$graphLookup`
   শেখার জন্য পারফেক্ট।

---

# LEVEL 1 — `$match` `$group` `$sum` `$count`

Aggregation-এর ভিত্তি। array নাই, join নাই — শুধু গুনতে আর যোগ করতে শেখা।

### 1. Order Status Summary

কোন status-এ কতটা অর্ডার আর কত টাকা।

- **Collection:** `orders`
- **শিখবেন:** `$group` with `_id`, `$sum: 1` (count), `$sum: "$field"`
- **Output:** `PENDING: 12 orders, ৳45,000` — এভাবে প্রতিটা status

```js
[
  { $group: { _id: "$status", orderCount: { $sum: 1 }, totalAmount: { $sum: "$total" } } },
  { $sort: { totalAmount: -1 } }
]
```

### 2. Payment Method Breakdown

কোন payment method সবচেয়ে বেশি ব্যবহার হয়, আর gateway charge কত যাচ্ছে।

- **Collection:** `payments`
- **শিখবেন:** একই `$group`-এ একাধিক accumulator, `$avg`
- **Output:** method-wise count, total amount, total gateway charge, net amount

`net = amount - gatewayCharge` — এটা `$project`-এ `$subtract` দিয়ে বের করবেন।

### 3. User Role & Status Count

কত USER, কত MERCHANT, কত ADMIN — আর তার মধ্যে কত ACTIVE।

- **Collection:** `users`
- **শিখবেন:** `$match` (soft delete বাদ দেওয়া), composite `_id` — `_id: { role: "$role", status: "$status" }`

### 4. Revenue Summary Card

ড্যাশবোর্ডের উপরের কার্ডগুলোর ডাটা — total revenue, total orders, AOV (average order value)।

- **Collection:** `orders`
- **শিখবেন:** `_id: null` দিয়ে পুরো collection একসাথে group করা, `$avg`, `$min`, `$max`
- **Output:** `{ totalRevenue, totalOrders, avgOrderValue, highestOrder, lowestOrder }`

⚠️ `$match: { paymentStatus: "PAID" }` দিতে ভুলবেন না — নাহলে PENDING অর্ডারও revenue-তে ঢুকে যাবে।

### 5. Discount & Delivery Charge Report

মোট কত ডিসকাউন্ট দিলেন, কত ডেলিভারি চার্জ নিলেন।

- **Collection:** `orders`
- **শিখবেন:** একসাথে অনেক `$sum`, `$project` দিয়ে percentage হিসাব (`$divide`, `$multiply`)

---

# LEVEL 2 — `$unwind` `$sort` `$limit` `$project`

এখানে array খোলা শিখবেন। `orders.items[]` আর `products.variants[]` — দুইটাই array।

### 6. Top Selling Products

সবচেয়ে বেশি বিক্রি হওয়া ১০টা প্রোডাক্ট।

- **Collection:** `orders`
- **শিখবেন:** `$unwind` — এটাই aggregation-এর সবচেয়ে জরুরি concept
- **Output:** product name, মোট কত পিস বিক্রি, মোট কত টাকা

```js
[
  { $match: { paymentStatus: "PAID" } },
  { $unwind: "$items" },
  { $group: {
      _id: "$items.productId",
      productName: { $first: "$items.productName" },
      totalQty: { $sum: "$items.quantity" },
      totalRevenue: { $sum: "$items.totalPrice" },
      orderCount: { $sum: 1 }
  }},
  { $sort: { totalQty: -1 } },
  { $limit: 10 }
]
```

`$first` কেন? group করার পর `productName` হারিয়ে যায়, তাই প্রথম ডকুমেন্টের নামটা ধরে রাখি।

### 7. Top Selling Variants (SKU-wise)

কোন color/size সবচেয়ে বেশি চলে।

- **Collection:** `orders`
- **শিখবেন:** `$unwind`-এর পর composite group key — `_id: { p: "$items.productId", v: "$items.variantId" }`

### 8. Low Stock Alert Report

যেসব variant-এ stock ১০-এর নিচে।

- **Collection:** `products`
- **শিখবেন:** `$unwind` করার **পরে** `$match` (দুইবার match — আগে product level, পরে variant level)

```js
[
  { $match: { isDeleted: false, status: "ACTIVE" } },
  { $unwind: "$variants" },
  { $match: { "variants.stock": { $lt: 10 } } },
  { $project: { name: 1, sku: "$variants.sku", stock: "$variants.stock", price: "$variants.price" } },
  { $sort: { stock: 1 } }
]
```

### 9. Inventory Valuation Report

গুদামে মোট কত টাকার মাল আছে।

- **Collection:** `products`
- **শিখবেন:** `$multiply` — `stock × price` করে তারপর `$sum`
- **Output:** মোট stock value, product count, variant count

### 10. Product Price Range

প্রতিটা প্রোডাক্টের সবচেয়ে কম আর বেশি দামের variant।

- **Collection:** `products`
- **শিখবেন:** `$min`/`$max` accumulator, অথবা `$unwind` ছাড়াই array operator — `$min: "$variants.price"`

দুইভাবে করে দেখবেন — এতে বুঝবেন কখন `$unwind` লাগে, কখন লাগে না। এটা পারফরম্যান্সের
জন্য গুরুত্বপূর্ণ শিক্ষা।

### 11. Top Customers by Spending

সবচেয়ে বেশি টাকা খরচ করা কাস্টমাররা।

- **Collection:** `orders`
- **শিখবেন:** `$group` by `user`, তারপর `$sort` + `$limit`
- **Output:** user id, order count, total spent, avg order value

(নাম দেখাতে `$lookup` লাগবে — সেটা Level 3-এ।)

### 12. Cart Abandonment Report

কোন কোন cart অনেকদিন পড়ে আছে অর্ডার ছাড়া।

- **Collection:** `carts`
- **শিখবেন:** `$match` with date comparison, `$group` by user
- **Output:** user, কতটা আইটেম, কতদিন পুরনো

---

# LEVEL 3 — `$lookup` (Join)

এখান থেকে আসল মজা শুরু। এক collection-এর সাথে আরেকটা জোড়া লাগানো।

### 13. Category-wise Sales Report ⭐

কোন ক্যাটাগরিতে কত বিক্রি। **এটা সবচেয়ে শেখার মতো report।**

- **Collection:** `orders` → `products` → `categories`
- **শিখবেন:** double `$lookup`, `$unwind` on lookup result

```js
[
  { $match: { paymentStatus: "PAID" } },
  { $unwind: "$items" },
  { $lookup: {
      from: "products",
      localField: "items.productId",
      foreignField: "_id",
      as: "product"
  }},
  { $unwind: "$product" },
  { $group: {
      _id: "$product.category",
      totalQty: { $sum: "$items.quantity" },
      totalRevenue: { $sum: "$items.totalPrice" }
  }},
  { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
  { $unwind: "$category" },
  { $project: { categoryName: "$category.name", totalQty: 1, totalRevenue: 1 } },
  { $sort: { totalRevenue: -1 } }
]
```

💡 খেয়াল করুন — `$group` করার **পরে** `$lookup` করা হয়েছে। কারণ ১০০০ অর্ডারের জন্য
১০০০ বার lookup করার চেয়ে, group করে ১০টা category বানিয়ে তারপর ১০ বার lookup করা
অনেক দ্রুত। **এটা aggregation optimization-এর সবচেয়ে বড় শিক্ষা।**

### 14. Brand-wise Sales Report

উপরেরটার মতোই, শুধু `category` এর জায়গায় `brand`। নিজে নিজে করে দেখবেন — এটা আপনার
Level 13 বুঝেছেন কিনা তার পরীক্ষা।

### 15. Shop / Merchant Sales Report ⭐

কোন shop কত বিক্রি করেছে। Multi-vendor marketplace-এর সবচেয়ে দরকারি report।

- **Collection:** `orders` → `products` → `shops` → `users` (owner)
- **শিখবেন:** তিন লেভেল `$lookup` chain
- **Output:** shop name, owner name, order count, total revenue, commission (ধরুন ১০%)

### 16. Shop Performance Dashboard

প্রতিটা shop-এর: কত প্রোডাক্ট, কত active, কত বিক্রি, কত stock পড়ে আছে।

- **শিখবেন:** `$lookup` with **pipeline** (sub-pipeline সহ lookup) — নতুন syntax

```js
{ $lookup: {
    from: "products",
    let: { shopId: "$_id" },
    pipeline: [
      { $match: { $expr: { $eq: ["$shop", "$$shopId"] }, isDeleted: false } },
      { $count: "total" }
    ],
    as: "productStats"
}}
```

`$$shopId` (দুইটা ডলার) — outer variable, `$shop` (একটা) — inner field। এই পার্থক্যটা
মনে রাখবেন, শুরুতে সবাই এখানে আটকায়।

### 17. Never Sold Products Report

যেসব প্রোডাক্ট একবারও বিক্রি হয়নি।

- **Collection:** `products` → `orders`
- **শিখবেন:** `$lookup` করে `$match: { soldItems: { $size: 0 } }` — মানে খালি array খোঁজা

এটা SQL-এর `LEFT JOIN ... WHERE right IS NULL` এর সমান।

### 18. Payment Reconciliation Report ⭐

Order আর Payment-এর হিসাব মিলছে কিনা। যেখানে গড়মিল আছে সেগুলো বের করা।

- **Collection:** `orders` → `payments`
- **শিখবেন:** `$lookup` + `$cond` + `$ne` দিয়ে mismatch detect
- **কী খুঁজবেন:**
  - order `PAID` কিন্তু payment record নাই
  - payment `SUCCESS` কিন্তু order `PENDING`
  - `order.total ≠ payment.amount`

এটা বাস্তব কাজেও লাগবে — accounting bug ধরার জন্য।

### 19. Customer Detail Report

প্রতিটা কাস্টমারের পূর্ণ প্রোফাইল — নাম, order count, total spent, শেষ অর্ডারের তারিখ, ডিফল্ট address।

- **Collection:** `users` → `orders` → `addresses`
- **শিখবেন:** একাধিক lookup, `$arrayElemAt` দিয়ে array থেকে একটা এলিমেন্ট নেওয়া

---

# LEVEL 4 — Date Operators & Time Series

চার্ট বানানোর ডাটা। line chart, bar chart — সব এখান থেকে।

### 20. Daily Sales Trend ⭐

শেষ ৩০ দিনের দিন-ভিত্তিক বিক্রি।

- **Collection:** `orders`
- **শিখবেন:** `$dateToString`, অথবা নতুন `$dateTrunc`

```js
[
  { $match: { paymentStatus: "PAID", createdAt: { $gte: thirtyDaysAgo } } },
  { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" } },
      orders: { $sum: 1 },
      revenue: { $sum: "$total" }
  }},
  { $sort: { _id: 1 } }
]
```

⚠️ `timezone: "Asia/Dhaka"` দিতে ভুলবেন না। না দিলে UTC ধরবে, তখন রাত ১২টা-৬টার
অর্ডারগুলো আগের দিনে চলে যাবে — আপনার রিপোর্ট ভুল হবে।

### 21. Monthly Sales Report

মাস-ভিত্তিক। format হবে `"%Y-%m"`।

- **শিখবেন:** `$year`, `$month` আলাদা ফিল্ড হিসেবেও করা যায় — দুইভাবে try করবেন

### 22. Hour-of-Day Heat Map

দিনের কোন সময়ে সবচেয়ে বেশি অর্ডার আসে।

- **শিখবেন:** `$hour` with timezone
- **কাজে লাগে:** কখন ad চালাবেন, কখন সাপোর্ট টিম বেশি রাখবেন

### 23. Day-of-Week Report

সপ্তাহের কোন দিন বেশি বিক্রি।

- **শিখবেন:** `$dayOfWeek`, `$switch` দিয়ে সংখ্যাকে নাম বানানো (1 → "Sunday")

```js
{ $addFields: { dayName: { $switch: { branches: [
    { case: { $eq: ["$dow", 1] }, then: "Sunday" },
    // ...
], default: "Unknown" }}}}
```

### 24. Month-over-Month Growth ⭐

গত মাসের তুলনায় এই মাসে কত % বাড়ল/কমল।

- **শিখবেন:** `$setWindowFields` — MongoDB 5.0+ এর দুর্দান্ত ফিচার

```js
{ $setWindowFields: {
    sortBy: { month: 1 },
    output: { prevRevenue: { $shift: { output: "$revenue", by: -1 } } }
}}
```

তারপর `$project`-এ growth % হিসাব। এটা SQL-এর window function-এর সমান।

### 25. New User Registration Trend

মাসে কত নতুন ইউজার আসছে, আর তার মধ্যে কত MERCHANT।

- **Collection:** `users`
- **শিখবেন:** date group + conditional count — `$sum: { $cond: [{ $eq: ["$role", "MERCHANT"] }, 1, 0] }`

`$cond` ভেতরে `$sum` — এই প্যাটার্নটা মনে রাখবেন, খুব কাজে লাগে।

### 26. Payment Success Rate Over Time

দিন-ভিত্তিক কত % পেমেন্ট সফল হচ্ছে।

- **Collection:** `payments`
- **শিখবেন:** conditional `$sum` দিয়ে ratio বের করা, `$round`

Gateway-তে সমস্যা হলে এই report-এ ধরা পড়বে।

---

# LEVEL 5 — `$facet` `$bucket` এবং Advanced

এখানে একটা query দিয়ে অনেক কাজ করা শিখবেন।

### 27. Complete Dashboard — One Query ⭐⭐

একটা মাত্র aggregation call দিয়ে পুরো ড্যাশবোর্ডের সব ডাটা।

- **শিখবেন:** `$facet` — একই ইনপুট নিয়ে সমান্তরালে অনেকগুলো pipeline চালানো

```js
[
  { $match: { createdAt: { $gte: startDate } } },
  { $facet: {
      summary:      [ { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } } ],
      byStatus:     [ { $group: { _id: "$status", count: { $sum: 1 } } } ],
      byMethod:     [ { $group: { _id: "$paymentMethod", count: { $sum: 1 } } } ],
      dailyTrend:   [ { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" } } }, { $sort: { _id: 1 } } ],
      topProducts:  [ { $unwind: "$items" }, { $group: { _id: "$items.productName", qty: { $sum: "$items.quantity" } } }, { $sort: { qty: -1 } }, { $limit: 5 } ]
  }}
]
```

৫টা আলাদা API call-এর বদলে ১টা। ড্যাশবোর্ড লোডিং অনেক দ্রুত হবে।

### 28. Order Value Distribution

কত অর্ডার ৫০০ টাকার নিচে, কত ৫০০-১০০০, কত ১০০০+।

- **শিখবেন:** `$bucket` (নির্দিষ্ট সীমা), `$bucketAuto` (অটো ভাগ)

```js
{ $bucket: {
    groupBy: "$total",
    boundaries: [0, 500, 1000, 2000, 5000, Infinity],
    default: "Other",
    output: { count: { $sum: 1 }, revenue: { $sum: "$total" } }
}}
```

### 29. Geographic Sales Report

কোন division/city থেকে কত অর্ডার।

- **Collection:** `orders` (`shippingAddress` embedded আছে, তাই lookup লাগবে না!)
- **শিখবেন:** nested field-এ group, দুই লেভেল drill-down (division → city)
- **Bonus:** `$group` করে `$push` দিয়ে প্রতিটা division-এর ভেতরে city-র array বানানো

### 30. Repeat vs One-time Customer

কত কাস্টমার একবার কিনেছে, কত বারবার কেনে।

- **শিখবেন:** দুই ধাপে `$group` — আগে user-wise, তারপর সেই রেজাল্টের উপর আবার group

```js
[
  { $group: { _id: "$user", orderCount: { $sum: 1 }, spent: { $sum: "$total" } } },
  { $group: {
      _id: { $cond: [{ $gt: ["$orderCount", 1] }, "REPEAT", "ONE_TIME"] },
      customers: { $sum: 1 },
      revenue: { $sum: "$spent" }
  }}
]
```

"group করার পর আবার group" — এই ধারণাটা খুব শক্তিশালী, অনেক জায়গায় লাগবে।

### 31. RFM Customer Segmentation ⭐⭐

কাস্টমারকে ভাগ করা: Champion / Loyal / At Risk / Lost।

- **শিখবেন:** `$facet` + `$bucket` + nested `$switch`, date difference (`$dateDiff`)
- **লজিক:**
  - **R**ecency — শেষ কতদিন আগে কিনেছে
  - **F**requency — কতবার কিনেছে
  - **M**onetary — মোট কত খরচ করেছে

তিনটা স্কোর মিলিয়ে segment। মার্কেটিং টিমের জন্য সবচেয়ে দামি report।

### 32. Category Tree Rollup ⭐⭐

parent category-র রিপোর্টে তার সব sub-category-র বিক্রিও যোগ হবে।

- **Collection:** `categories` (self-reference!) → `products` → `orders`
- **শিখবেন:** `$graphLookup` — recursive traversal

```js
{ $graphLookup: {
    from: "categories",
    startWith: "$_id",
    connectFromField: "_id",
    connectToField: "parentCategory",
    as: "descendants",
    maxDepth: 5
}}
```

আপনার `category.model.js`-এ `parentCategory` আছে বলেই এটা সম্ভব। Tree structure নিয়ে
কাজ করার এটাই সঠিক টুল — recursive JS loop লিখে DB-তে বারবার query করার দরকার নাই।

### 33. Sales Funnel Report

Cart → Order → Paid → Delivered — প্রতি ধাপে কত % ঝরে যাচ্ছে।

- **Collection:** `carts` + `orders`
- **শিখবেন:** `$unionWith` — দুই collection একসাথে জোড়া লাগানো, তারপর `$facet`

### 34. Cohort Retention Analysis ⭐⭐⭐

জানুয়ারিতে যারা প্রথম কিনেছে, তাদের কতজন ফেব্রুয়ারিতে আবার কিনেছে।

- **শিখবেন:** `$group` দিয়ে first-order month বের করা, `$dateDiff` দিয়ে month offset,
  তারপর matrix বানানো — aggregation-এর সবচেয়ে কঠিন কাজগুলোর একটা

এটা সবার শেষে করবেন। এখানে সফল হলে ধরে নিতে পারেন aggregation আপনার শেখা হয়ে গেছে।

### 35. Materialized Daily Summary

প্রতিদিন রাতে একবার হিসাব করে আলাদা collection-এ সেভ রাখা, যাতে report instant লোড হয়।

- **শিখবেন:** `$merge` (upsert করে) আর `$out` (পুরো replace করে) — পার্থক্যটা বুঝবেন
- **কোথায় বসাবে:** আপনার `src/queues` / `src/workers` ফোল্ডার আছে — cron job হিসেবে ওখানে

এটাই বাস্তব প্রোডাকশনে বড় রিপোর্ট দ্রুত করার আসল উপায়।

---

## এখনকার Schema-তে যেসব Report **করা যাবে না**

সৎভাবে বলে রাখি — কিছু ক্লাসিক ই-কমার্স report আপনার এখনকার model দিয়ে সম্ভব না।
করতে চাইলে schema-তে কিছু যোগ করতে হবে:

| Report | কেন যাচ্ছে না | কী যোগ করতে হবে |
|---|---|---|
| Delivery time / SLA report | কখন CONFIRMED হলো, কখন SHIPPED হলো — এই timestamp নাই। শুধু বর্তমান `status` আছে | order-এ `statusHistory: [{ status, changedAt, changedBy }]` array |
| Product rating / review report | Review model নাই | `Review` collection |
| Coupon performance | `discount` শুধু সংখ্যা, কোন coupon থেকে এলো জানা নাই | `Coupon` model + order-এ `couponCode` |
| Conversion rate (view → buy) | product view track হয় না | `ProductView` collection বা analytics event |
| Stock movement history | শুধু বর্তমান stock আছে, কে কখন কমালো নাই | `StockLog` collection |
| Abandoned cart recovery | cart মুছে গেলে ইতিহাস থাকে না | cart-এ soft delete বা `CartEvent` log |

এর মধ্যে **statusHistory** সবচেয়ে বেশি কাজে লাগবে — delivery performance report
ছাড়া কোনো ই-কমার্স ড্যাশবোর্ড পূর্ণ হয় না। ওটা যোগ করা সহজও।

---

## যেভাবে আগাবেন — সাজেস্টেড ক্রম

**সপ্তাহ ১ — ভিত্তি**
`1 → 4 → 6 → 8` — এই চারটা করলে `$match`, `$group`, `$unwind`, `$project` হাতে চলে আসবে।
এগুলোই aggregation-এর ৮০%।

**সপ্তাহ ২ — Join**
`13 → 14 → 15 → 18` — `$lookup` ভালো করে শিখবেন। ১৩ নম্বরটা মন দিয়ে করবেন,
বিশেষ করে "group করে তারপর lookup" এই optimization-টা।

**সপ্তাহ ৩ — Time series**
`20 → 21 → 24 → 26` — চার্টের ডাটা আর window function।

**সপ্তাহ ৪ — Advanced**
`27 → 28 → 30 → 32` — `$facet`, `$bucket`, `$graphLookup`।

**তারপর যখন সময় পাবেন**
`31 → 34 → 35` — RFM, cohort, materialized view।

---

## কাজ করার সময় যেসব নিয়ম মনে রাখবেন

**১. `$match` সবসময় সবার আগে**
Pipeline-এর শুরুতে `$match` দিলে MongoDB index ব্যবহার করতে পারে। মাঝখানে দিলে পারে না।
এটা ১০০x পার্থক্য গড়ে দিতে পারে।

**২. `$lookup` যত দেরিতে সম্ভব**
আগে `$match` + `$group` দিয়ে ডকুমেন্ট সংখ্যা কমান, তারপর join করুন।

**৩. `$project` দিয়ে অদরকারি ফিল্ড ফেলে দিন**
বিশেষ করে `$unwind`-এর আগে। কম ডাটা মানে কম মেমোরি।

**৪. `.explain("executionStats")` চালিয়ে দেখুন**
```js
await Order.aggregate(pipeline).explain("executionStats")
```
`COLLSCAN` দেখলে বুঝবেন index মিস করেছেন, `IXSCAN` দেখলে ঠিক আছে।

**৫. Soft delete ভুলবেন না**
আপনার প্রায় সব model-এ `isDeleted` আছে। `$match: { isDeleted: false }` না দিলে
মুছে ফেলা ডাটাও রিপোর্টে চলে আসবে।

**৬. Revenue মানে `paymentStatus: "PAID"`**
`status: "CANCELLED"` বা `paymentStatus: "PENDING"` অর্ডার revenue না। এই ভুলটা
সবচেয়ে বেশি হয়, আর ধরা পড়ে অনেক পরে।

**৭. Timezone সবসময় `Asia/Dhaka`**
যেকোনো date grouping-এ। না দিলে দিনের হিসাব ৬ ঘণ্টা সরে যাবে।

---

## Index যা লাগবে

Report চালানোর আগে এগুলো যোগ করে নিলে অনেক দ্রুত চলবে:

```js
// order.model.js
orderSchema.index({ paymentStatus: 1, createdAt: -1 });   // revenue report
orderSchema.index({ createdAt: -1 });                      // trend report
orderSchema.index({ "items.productId": 1 });               // product-wise sales

// product.model.js
productSchema.index({ shop: 1, isDeleted: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ "variants.stock": 1 });              // low stock alert

// payment.model.js — paymentStatus index আগেই আছে ✅
paymentSchema.index({ paymentMethod: 1, createdAt: -1 });

// user.model.js
userSchema.index({ role: 1, isDeleted: 1 });
userSchema.index({ createdAt: -1 });
```

---

## কোথায় কোড লিখবেন

আপনার প্রজেক্টের প্যাটার্ন অনুযায়ী:

```
src/repositories/report.repository.js   ← শুধু aggregation pipeline গুলো
src/services/report.service.js          ← filter validation, date parsing, ফরম্যাটিং
src/controllers/reportController.js     ← req/res হ্যান্ডলিং
src/routes/report.routes.js             ← authGuard + roleGuard(ADMIN, SUPER_ADMIN)
src/validations/report.validation.js    ← Joi দিয়ে date range, groupBy validate
```

Report route-এ `roleGuard` দিতে ভুলবেন না — বিক্রির ডাটা সবার দেখার জিনিস না।
আর MERCHANT role-এর জন্য শুধু নিজের shop-এর ডাটা দেখানোর ব্যবস্থা রাখবেন
(`product.routes.js`-এ shop owner check-এর যে প্যাটার্ন আছে সেটার মতো)।

Redis caching-ও ভাবতে পারেন — `category.service.js`-এ যেভাবে করেছেন। Report সাধারণত
ভারী query, আর ৫ মিনিট পুরনো ডাটা হলেও ক্ষতি নাই।
