import mongoose from "mongoose";
const Schema = mongoose.Schema;

const croSchema = new Schema({
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cro",
        required: false,
    },
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
    role: {
        type: String,
        default: "crofollower",
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


const User = mongoose.model("crofollower", croSchema);
export default User;

