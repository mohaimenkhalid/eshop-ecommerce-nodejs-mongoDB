const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const shopSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },

        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },

        owner: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: null,
        },

        logo: {
            type: String,
            default: null,
        },

        banner: {
            type: String,
            default: null,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: null,
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

module.exports = mongoose.model('Shop', shopSchema);
