const mongoose = require('mongoose')
const Product = require('../models/product.model')
const Shop = require('../models/shop.model')

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        const shop = Shop.findOne({
            slug: ''
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

    } catch (e) {
        console.log(e)
        process.exit(1)
    }
}


migrate()

//node scripts/migrate-products-to-shop.js