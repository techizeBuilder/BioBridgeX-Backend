import mongoose from "mongoose";
const Schema = mongoose.Schema;

const chat = new Schema({
    chatid: {
        type: String,
        required: true
    },
    projectid: {
        type: String,
        required: true
    },
    message: {
        type: String,
    },
    receiver: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        required: true
    },
    seen: {
        type: Boolean,
        required: true
    },
    file: {
        type: String,
        default: null
    }

}, { timestamps: true })



const chats = mongoose.model("chat", chat)
export default chats


