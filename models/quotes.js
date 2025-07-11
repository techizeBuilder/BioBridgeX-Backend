import mongoose from "mongoose";
const Schema = mongoose.Schema;
const quoteSchema = new Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
    },
    croId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cro",
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "buyer",
    },
    studyApproach: {
        type: String,
        required: true,
    },
    milestoneList:
    {
        type: [
            {
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
            }],
        default: []
    },
    deliverables: {
        type: String,
        required: true,
    },
    additionalServices: {
        type: String,
    },
    // compliance: {
    //     type: [String],
    // },
    buyerStatus: {
        type: String,
        enum: ["Pending", "Approved", "Rejected", "Revised"],
        default: "Pending"
    },
    adminStatus: {
        type: String,
        enum: ["Pending", "Approved", "Rejected", "Revised"],
        default: "Pending"
    },
    baseStudyCost: {
        type: Number,
        required: true,
    },
    deliveryShippingCosts: {
        type: Number,
    },
    // platformFee: {
    //     type: Number,
    //     default: function() {
    //         return this.baseStudyCost * 0.02;
    //     },
    // },
    proposedStartDate: {
        type: Date,
    },
    estimatedCompletion: {
        type: Number,
    },
    turnaroundTime: {
        type: String,
    },

    dependenciesDelays: {
        type: String,
    },
    attachments: {
        type: String,
        required: false,
        default: null
    },
    quoteValidUntil: {
        type: String,
        default: null
    },
    rejectReason: {
        type: String,
        default: null
    },
    reviseReason: {
        type: String,
        default: null
    },
}, {
    timestamps: true
}
);

const Quote = mongoose.model("Quote", quoteSchema);

export default Quote;