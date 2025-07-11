import mongoose from "mongoose";
const Schema = mongoose.Schema;

const buyerSchema = new Schema({
    profileImage: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },

    role: {
        type: String,
        default: "buyer",
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    status: {
        type: Number,
        default: 1,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    adminVerified: {
        type: Boolean,
        default: false
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model("buyer", buyerSchema);
export default User;
