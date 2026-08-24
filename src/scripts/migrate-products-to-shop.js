require('dotenv').config();
const mongoose = require('mongoose')
const Product = require('../models/product.model')
const Shop = require('../models/shop.model')

const migrate = async () => {
    try {
        console.log(process.env.MONGO_URI)
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce')
        const shop = await await Shop.findOne({
            slug: 'shop-1'
        });

        if (!shop) {
            throw new Error("Default shop not found")
        }

        const result = await Product.updateMany(
            {
                shop: { $exists: false },
            }, {
                $set: {
                    shop: shop._id,
                },
            }
        );
        console.log(`Matched: ${result.matchedCount}`);
        console.log(`Modified: ${result.modifiedCount}`);
        await mongoose.disconnect();

    } catch (e) {
        console.log(e)
        process.exit(1)
    }
}


migrate()

//node scripts/migrate-products-to-shop.js