import mongoose from "mongoose";
const organizationProfileSchema = new mongoose.Schema({
    croId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cro",
        required: true
    },
    organizationName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,

    },
    billingAddress: {
        type: String,
        required: true
    },
    shippingAddress: {
        type: String,
    },
    expertise: {
        type: [String],
        required: true
    },
    Overview: {
        type: String,
        required: true
    },
    availableServices: [{
        type: String,
        required: false
    }],
    masterServiceAgreement: {
        type: String,
        required: false,
    },
    certifications: [{
        name: {
            type: String,
            required: false
        },
        verified: {
            type: Boolean,
            default: false
        },
        filePath: {
            type: String,
            required: false
        }
    }],
    VerifyStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
}, { timestamps: true });

const OrganizationProfile = mongoose.model('OrganizationProfile', organizationProfileSchema);

export default OrganizationProfile;

