import { Schema, Types } from "mongoose";

const orderItemSchema = new Schema(
    {
        productId: {
            type: Types.ObjectId,
            ref: "Product",
            required: true,
        },

        variantId: {
            type: Types.ObjectId,
            required: true,
        },

        productName: {
            type: String,
            required: true,
            trim: true,
        },

        sku: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },

        image: {
            type: String,
            default: null,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        _id: false,
    }
);

const shippingAddressSchema = new Schema(
    {
        receiverName: String,
        receiverPhone: String,
        addressLine: String,
        area: String,
        city: String,
        division: String,
        postalCode: String,
        country: String,
    },
    {
        _id: false,
    }
);

const orderSchema = new Schema(
    {
        user: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
        },

        orderNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "Order must contain at least one item.",
            },
        },

        shippingAddress: {
            type: shippingAddressSchema,
            required: true,
        },

        paymentMethod: {
            type: String,
            enum: ["COD", "BKASH", "NAGAD", "CARD"],
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
            default: "PENDING",
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "CONFIRMED",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED",
            ],
            default: "PENDING",
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        discount: {
            type: Number,
            default: 0,
            min: 0,
        },

        deliveryCharge: {
            type: Number,
            default: 0,
            min: 0,
        },

        total: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

orderSchema.index({ orderNumber: 1 }, { unique: true });

orderSchema.index({ status: 1 });

orderSchema.index({ user: 1, createdAt: -1 });
