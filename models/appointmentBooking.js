import mongoose from "mongoose";

const appointmentBookingSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

const AppointmentBooking = mongoose.model('AppointmentBooking', appointmentBookingSchema);

export default AppointmentBooking;