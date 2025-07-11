import mongoose from "mongoose";
const Schema = mongoose.Schema;

const buyerSchema = new Schema({
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "buyer",
    },
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
        default: "buyerfollower",
    },
    status: {
        type: Number,
        default: 1,
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model("buyerfollower", buyerSchema);
export default User;
