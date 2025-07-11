import mongoose from "mongoose";
const Schema = mongoose.Schema;

const croSchema = new Schema({
    profileImage: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        unique: false,
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
        default: "cro",
    },
    password: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
        default: "",
        required: false
    },
    organizationName: {
        type: String,
        trim: true,
        default: "",
    },
    businessAddress: {
        type: String,
        trim: true,
        default: "",
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


const User = mongoose.model("cro", croSchema);
export default User;

