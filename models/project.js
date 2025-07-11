import mongoose from "mongoose";
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "buyer",
        required: true
    },
    projectCode: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    serviceCategory: {
        type: String,
        required: true,
    },
    desiredCroExpertise: {
        type: [String],
    },
    studyTypeProtocolOutline: {
        type: [String],
        required: true,
    },
    animalModel: {
        type: String,
    },
    sampleSizeExpectedThroughput: {
        type: String,
    },
    // endpointsOfInterest: {
    //     type: [String],
    //     required: true,
    // },
    attachments: {
        type: [{
            name: {
                type: String,
            },
            filePath: {
                type: String,
            }
        }

        ],
        default: null
    },
    projectStartDate: {
        type: Date,
    },

    projectEndDate: {
        type: Date,
    },
    projectUrgency: {
        type: String,
    },
    budgetRange: {
        type: String,
    },
    clearanceAmount: {
        type: Number,
        default: 0,
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin"

    },
    additionalComplianceNotes: {
        type: String,
    },
    SpecialInstructions: {
        type: String,
    },
    status: {
        type: String,
        enum: ["Pending", "UnderDiscussion", "Approved", "Rejected"],
        default: "Pending",
    },
    projectComplitionStatus: {
        type: String,
        enum: ["Pending", "InProgress", "Completed"],
        default: "Pending",
    },
    milestones: [{
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
            enum: ["Pending", "In Progress", "Done"],
            default: "Pending"
        }
    }],
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "cro"
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Project = mongoose.model("Project", projectSchema);
export default Project;