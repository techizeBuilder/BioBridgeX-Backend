import mongoose from "mongoose";
const Schema = mongoose.Schema;

const disputeSchema = new Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    },
    initiatedBy: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        userType: {
            type: String,
            required: true
        }
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "buyer",
        required: true
    },
    croId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cro",
        required: true
    },

    disputeTitle: {
        type: String,
        required: true
    },
    disputeTopic: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Open", "Under Review", "MarkAsDone", "closed"],
        default: "Open"
    },
    screenShots: [{
        name: {
            type: String,
            required: false
        },
        filePath: {
            type: String,
            required: false
        }
    }]
}, { timestamps: true });

const Dispute = mongoose.model("Dispute", disputeSchema);
export default Dispute;