import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const dbUri = process.env.MONGODB_URI;
const connectDB = async () => {
    try {
        if (!dbUri) {
            throw new Error('MongoDB URI is not defined in environment variables');
        }

        await mongoose.connect(dbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

export default connectDB;