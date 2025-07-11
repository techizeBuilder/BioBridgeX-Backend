import mongoose from "mongoose"

const reviseModel = mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    AdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'buyer',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
        required: true
    }
}, { timestamps: true });

const ProjectRevise = mongoose.model('ProjectRevise', reviseModel);
export default ProjectRevise;


