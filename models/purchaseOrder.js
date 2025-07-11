import mongoose from "mongoose";
const Schema = mongoose.Schema;

const purchaseOrderSchema = new Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "buyer",
        required: true,
    },
    croId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cro",
        required: true,
    },
    quoteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "quote",
        required: true,
    },
    projectName: {
        type: String,
        required: true,
    },
    projectPostDate: {
        type: Date,
        required: true,
    },
    purchaseOrderUploadDate: {
        type: Date,
        required: true,
    },
    buyerName: {
        type: String,
        required: true,
    },
    attatchement: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected", "Revised"],
        default: "Pending"
    },
    rejectReason: {
        type: String,
    },
    reviseReason: {
        type: String,
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

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);

export default PurchaseOrder;