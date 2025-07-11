import express from "express";
const router = express.Router();
import {
    registerUser,
    login,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    getUserById
} from "../controllers/authController.js";

router.post("/register", registerUser);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verify-email", resendVerificationEmail);
router.get("/get-single-user/:id",getUserById)

export default router;