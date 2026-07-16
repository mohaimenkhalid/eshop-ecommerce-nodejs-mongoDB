import mongoose, { Schema, Types } from "mongoose";

const variantSchema = new Schema(
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

const productSchema = new Schema(
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
            type: Types.ObjectId,
            ref: "Category",
            required: true,
        },

        brand: {
            type: Types.ObjectId,
            ref: "Brand",
            required: true,
        },

        variants: [variantSchema],

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