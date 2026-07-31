const mongoose = require('mongoose')

const variantSchema = new mongoose.Schema(
    {
        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },

        color: {
            type: String,
            trim: true,
        },

        size: {
            type: String,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        images: [
            {
                type: String,
            },
        ],
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },

        description: {
            type: String,
            default: null,
        },

        category: {
            type: mongoose.Types.ObjectId,
            ref: "Category",
            required: true,
        },

        brand: {
            type: mongoose.Types.ObjectId,
            ref: "Brand",
            required: true,
        },

        variants: {
            type: [variantSchema],
            validate: {
                validator: (variants) => variants.length > 0,
                message: "At least one variant is required."
            }
        },

        isFeatured: {
            type: Boolean,
            default: false,
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("Product", productSchema)