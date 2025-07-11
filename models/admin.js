import mongoose from "mongoose";
const Schema = mongoose.Schema;

const adminSchema = new Schema({
    profileImage: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    role: {
        type: String,
        default: "admin",
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
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});




const User = mongoose.model("admin", adminSchema);
export default User;

