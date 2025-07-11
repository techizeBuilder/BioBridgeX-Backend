import env from "dotenv";
env.config();

export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
export const JWT_EXPIRES_IN = "168h";
export const RESET_TOKEN_EXPIRES_IN = "1h";
