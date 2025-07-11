import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    eventType: {
        type: String,
        required: true,
    },
    data: {
        type: Object,
        required: true,
    },
    isRead: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;