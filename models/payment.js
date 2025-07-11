import mongoose from "mongoose";
const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    Totalamount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },
    orderId: {
        type: String,
        default: null
    },
    payeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "buyer",
        required: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    payTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cro",
        required: false,
    },
    po: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "purchaseOrder",
        required: false,
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending",
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Completed"],
        required: true,
        default: "Pending",
    },
    croConfirmationStatus: {
        type: String,
        enum: ["Pending", "Received"],
        required: true,
        default: "Pending",
    },
    milestone: {
        type: {
            milestoneName: {
                type: String,
            },
            description: {
                type: String,
            },
            timeLine: {
                type: Number,
            },
            mileStoneBudget: {
                type: Number,
            },
            status: {
                type: String,
                enum: ["Pending", "Done"],
                default: "Pending"
            }
        },
        required: false,
        default: null
    },
    attatchement: {
        type: String,
    },
    percentage: {
        type: Number,
        required: true,
    },
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;

