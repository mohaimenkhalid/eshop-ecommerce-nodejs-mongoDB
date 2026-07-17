import { Schema, Types } from "mongoose";

const paymentSchema = new Schema(
    {
        paymentNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        order: {
            type: Types.ObjectId,
            ref: "Order",
            required: true,
        },

        user: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        paymentMethod: {
            type: String,
            enum: ["COD", "BKASH", "NAGAD", "CARD"],
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: [
                "PENDING",
                "SUCCESS",
                "FAILED",
                "CANCELLED",
                "REFUNDED",
            ],
            default: "PENDING",
        },

        transactionId: {
            type: String,
            trim: true,
            default: null,
        },

        paidAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// One payment per order
paymentSchema.index(
    { order: 1 },
    { unique: true }
);

// Payment number lookup
paymentSchema.index(
    { paymentNumber: 1 },
    { unique: true }
);

// User payment history
paymentSchema.index(
    { user: 1, createdAt: -1 }
);

// Filter payments by status
paymentSchema.index({
    paymentStatus: 1,
});