import mongoose from "mongoose";
const Schema = mongoose.Schema;

const adminSettingSchema = new Schema({
    general: {
        siteName:
        {
            type: String,
            required: false,
            trim: true,
            default: "My Site",
        },
        baseUrl:
        {
            type: String,
            required: false,
            trim: true,
            default: "https://example.com",
        },
        contactEmail:
        {
            type: String,
            required: false,
            trim: true,
        },
        siteLogo:
        {
            type: String,
            required: false,
        },
    },
    fees: {
        paltformFee:
        {
            type: Number,
            required: false,
        },
        monthlySubscriptionFee:
        {
            type: Number,
            required: false,
        },
    },
    mentenanceMode:
    {
        type: Boolean,
        default: false,
    },
    landingPage: {
        headingName: {
            type: [{
                type: String,
                required: false,
                trim: true,
            }],
            default: ["Welcome to BioBridgeX"]
        }
    }
});

const AdminSetting = mongoose.model("adminSetting", adminSettingSchema);
export default AdminSetting;