import mongoose, { Schema, Types } from "mongoose";

const addressSchema = new Schema(
    {
        user: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
        },

        receiverName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        receiverPhone: {
            type: String,
            required: true,
            trim: true,
        },

        addressLine: {
            type: String,
            required: true,
            trim: true,
            maxlength: 255,
        },

        area: {
            type: String,
            required: true,
            trim: true,
        },

        city: {
            type: String,
            required: true,
            trim: true,
        },

        division: {
            type: String,
            required: true,
            trim: true,
        },

        postalCode: {
            type: String,
            required: true,
            trim: true,
        },

        country: {
            type: String,
            required: true,
            trim: true,
            default: "Bangladesh",
        },

        addressType: {
            type: String,
            enum: ["HOME", "OFFICE", "OTHER"],
            default: "HOME",
        },

        extraNote: {
            type: String,
            trim: true,
            default: null,
        },

        isDefault: {
            type: Boolean,
            default: false,
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

module.exports = mongoose.model("Address", addressSchema)