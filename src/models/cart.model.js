import mongoose, { Schema, Types } from "mongoose";

const cartSchema = new Schema(
    {
        user: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
        },

        product: {
            type: Types.ObjectId,
            ref: "Product",
            required: true,
        },

        variantId: {
            type: Types.ObjectId,
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

//combined index
cartSchema.index(
    {
        user: 1,
        variantId: 1,
    },
    {
        unique: true,
    }
);

//general index
// cartSchema.index({
//     user: 1,
// });

module.exports = mongoose.model("Cart", cartSchema)