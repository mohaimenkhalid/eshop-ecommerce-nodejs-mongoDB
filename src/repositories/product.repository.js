const Product = require('../models/product.model')


exports.create = async (payload) => {
    const product = new Product(payload)
    return await product.save();
}

exports.update = async (id, payload) => {
    return await Product.findByIdAndUpdate(id, payload, {
        returnDocument: 'after',
        runValidators: true
    })
}

exports.getProductById = (id) => {
    return  Product.findById(id).lean();
}

exports.addVariant = (id, payload) => {
    return Product.findByIdAndUpdate(id, {
        $push: {
            variants: payload,
        },
    },
    {
        returnDocument: 'after',
        runValidators: true
    }
        )
}

exports.updateVariantById = async (variantId, payload) => {
    const updateFields = {};

    Object.entries(payload).forEach(([key, value]) => {
        if (typeof value !== "undefined") {
            updateFields[`variants.$.${key}`] = value;
        }
    });

    // $set: {
    //     "variants.$.sku": payload.sku,
    //         "variants.$.color": payload.color,
    //         "variants.$.size": payload.size,
    //         "variants.$.price": payload.price,
    //         "variants.$.stock": payload.stock,
    //         "variants.$.images": payload.images,
    // },

    const product = await Product.findOneAndUpdate(
        {
            "variants._id": variantId,
        },
        {
            $set: updateFields,
        },
        {
            returnDocument: "after",
            runValidators: true,
        }
    );

    return product?.variants.id(variantId);

}

exports.findVariantBySku = async (sku) => {
    const product = await Product.findOne(
        {
            "variants.sku": sku,
        },
        {
            "variants.$": 1,
        }
    );

    if (!product) {
        return null;
    }

    return product.variants.id(product.variants[0]._id);
};

exports.findVariantById = async (variantId) => {
    const product = await Product.findOne(
        { 'variants._id': variantId },
        { 'variants.$': 1 }
    );

    if (!product) return null;
    return product.variants.id(variantId);
};


exports.deleteVariant = async (variantId) => {
    return await Product.findOneAndUpdate(
        {
            "variants._id": variantId,
        },
        {
            $pull: {
                variants: {
                    _id: variantId,
                },
            },
        },
        {
            returnDocument: "after",
        }
    );
};

exports.addVariantImages = async (variantId, imageUrls) => {
    const product = await Product.findOneAndUpdate(
        { 'variants._id': variantId },
        {
            $push: {
                'variants.$.images': {
                    $each: imageUrls,
                },
            },
        },
        {
            returnDocument: 'after',
            runValidators: true,
        }
    );

    return product?.variants.id(variantId);
};

exports.deleteVariantImage = async (variantId, imageUrl) => {
    const product = await Product.findOneAndUpdate(
        { 'variants._id': variantId },
        {
            $pull: {
                'variants.$.images': imageUrl,
            },
        },
        {
            returnDocument: 'after',
        }
    );

    return product?.variants.id(variantId);
};