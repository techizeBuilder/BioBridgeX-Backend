import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/email.js";
import { validationResult } from "express-validator";
import buyer from "../models/buyer.js";
import admin from "../models/admin.js";
import cro from "../models/cro.js";
import emailVerification from "../utils/EmailTemplates/emailVerification.js";
import { BAD_REQUEST, OK, UNAUTHORIZED } from "http-status-codes";
import User from "../models/admin.js";
import { notificationServiceInstance } from "../utils/socketserver.js";
import buyerfollower from "../models/buyerfollower.js";
import crofollower from "../models/crofollower.js";
import mongoose from "mongoose";
import successVerified from "../utils/EmailTemplates/VerifiedTemp.js";
import forgatePassword from "../utils/EmailTemplates/forgatepassword.js";


// Function to generate a DiceBear avatar URL
const getAvatarUrl = (seed, style = "adventurer") => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
};

const generateRandomPassword = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const createSendToken = (user, statusCode, child, res) => {
    const token = jwt.sign({ userId: user._id, type: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    res.cookie("jwt", token, cookieOptions);
    user.password = undefined;
    res.status(statusCode).json({
        status: "success",
        token,
        data: { user },
        child,
    });
};

export const registerUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: false, error: errors.array()[0].msg });
        }

        const { email, password, name, type } = req.body;
        let UserModel;
        if (type === "buyer") {
            UserModel = buyer;
        } else if (type === "cro") {
            UserModel = cro;
        } else if (type === "admin") {
            UserModel = admin;
        } else {
            return res.status(400).json({ error: "Invalid user type" });
        }

        const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const profileImage = getAvatarUrl(name);
        const hashedPassword = await bcrypt.hash(password, 10);
        const emailVerificationToken = jwt.sign(
            { email: email.toLowerCase(), type: type },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const user = new UserModel({
            profileImage,
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            emailVerificationToken,
        });

        const adminids = (await User.find({ role: "admin" }).select("_id")).map(user => user._id.toString());
        adminids.forEach(async (adminid) => {
            notificationServiceInstance.sendUserNotification(adminid, "USER_CREATED", {
                userId: adminid,
                title: type === "cro" ? `New CRO ${user.name} Registered.` : type === "buyer" ? `New Buyer ${user.name} Registered.` : `New Admin Registered.`,
                description: UserModel == cro ? `${process.env.DOMAIN}/admin/cro` : `${process.env.DOMAIN}/admin/buyer`,
            });
        })

        await user.save();

        const verificationLink = `${req.protocol}://${req.get("host")}/api/auth/verify-email/${emailVerificationToken}`;

        await sendEmail({
            email: user.email,
            subject: "Welcome to BioBridgeX-Confirm Your Account",
            html: emailVerification(user.name, verificationLink),
        });

        createSendToken(user, 201, false, res);
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Server error" });
    }
};
export const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email, type } = decoded;

        let userModel;
        if (type === "buyer") {
            userModel = await buyer.findOneAndUpdate(
                { email: email, },

                {
                    isVerified: true,
                    emailVerificationToken: null,
                    emailVerificationExpires: null,
                }, { new: true }
            );
        } else if (type === "cro") {
            userModel = await cro.findOneAndUpdate({ email: email, },

                {
                    isVerified: true,
                    emailVerificationToken: null,
                    emailVerificationExpires: null,
                }, { new: true }
            );
        } else if (type === "admin") {
            userModel = await admin.findOneAndUpdate({ email: email, },

                {
                    isVerified: true,
                    emailVerificationToken: null,
                    emailVerificationExpires: null,
                }, { new: true }
            );
        } else {
            return res.status(400).json({ message: "Invalid user type" });
        }

        // If no user is found or token is expired
        if (!userModel) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }


        res.status(200).send(
            successVerified()
        );

    } catch (error) {
        console.log(error);
        res.status(400).json({ message: "Email verification failed." });
    }
};
export const resendVerificationEmail = async (req, res, next) => {
    try {
        const { email, type } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Please provide an email address." });
        }

        let userModel;
        if (type === "buyer") {
            userModel = await buyer.findOne({ email });
        } else if (type === "cro") {
            userModel = await cro.findOne({ email });
        } else if (type === "admin") {
            userModel = await admin.findOne({ email });
        } else {
            return res.status(400).json({ message: "Invalid user type" });
        }

        // Find the user by email
        if (!userModel) {
            return res.status(404).json({ message: "No user found with that email address." });
        }

        // Check if the user's email is already verified
        if (userModel.isVerified) {
            return res.status(400).json({ message: "This email is already verified." });
        }

        // Generate a new verification token if the previous one doesn't exist or has expired
        const EmailReverificationToekn = jwt.sign(
            { email: userModel.email, type },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Create the verification link
        const verificationLink = `${req.protocol}://${req.get("host")}/api/auth/verify-email/${EmailReverificationToekn}?type=${type}`;

        // Send the verification email
        await sendEmail({
            email: userModel.email,
            subject: "Resend - Verify Your Email",
            html: emailVerification(userModel.name, verificationLink),
        });

        res.status(200).json({
            message: "Verification email sent successfully. Please check your inbox.",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to resend verification email." });
    }
};
export const forgotPassword = async (req, res, next) => {
    try {
        const { email, type } = req.body;
        if (!email) {
            return res.status(400).json({ errors: "please provide email" });
        }

        let UserModel;
        if (type === "buyer") {
            UserModel = buyer;
        } else if (type === "cro") {
            UserModel = cro;
        } else if (type === "admin") {
            UserModel = admin;
        } else {
            return res.status(400).json({ error: "Invalid user type" });
        }

        const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
        if (!existingUser) {
            return res.status(400).json({ error: "Email not register " });
        }

        // Generate reset token
        const emailVerificationToken = jwt.sign(
            { email: email.toLowerCase(), type: type },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const verificationLink = `https://backend.biobridgex.com/api/reset-password/${emailVerificationToken}`;
        sendEmail({
            email: existingUser.email,
            subject: "Reset Your BioBridgeX Password",
            html: forgatePassword(existingUser.name, verificationLink),
        });
        return res.status(200).json({
            status: true,
            message: "Email sent successfully",

        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error" });
    }
};
export const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { email, type } = decoded;

        let userModel;
        switch (type) {
            case "buyer":
                userModel = buyer;
                break;
            case "cro":
                userModel = cro;
                break;
            case "admin":
                userModel = admin;
                break;
            default:
                return res.status(400).json({ message: "Invalid user type" });
        }

        // Find user and update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await userModel.findOneAndUpdate(
            { email },
            {
                password: hashedPassword,
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }
        res.status(200).json({ message: "Password reset successfully!" });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Password reset failed. Please try again." });
    }
}
export const login = async (req, res) => {
    const { email, password, type } = req.body;
    if (!email || !password || !type) {
        return res.status(BAD_REQUEST).json({
            status: 'false',
            message: 'Please provide all required fields',
        });
    }
    let LoginModel;
    let user;
    switch (type) {
        case 'cro':
            LoginModel = cro;
            break;
        case 'buyer':
            LoginModel = buyer;
            break;
        case 'admin':
            LoginModel = admin;
            break;
        default:
            return res.status(BAD_REQUEST).json({
                status: 'fail',
                message: 'Invalid user type',
            });
    }
    if (LoginModel == admin) {
        user = await LoginModel.findOne({ email }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(UNAUTHORIZED).json({
                status: 'fail',
                message: 'Incorrect email or password',
            });
        }
        return createSendToken(user, OK, false, res);
    }


    else if (LoginModel == buyer) {

        user = await LoginModel.findOne({ email });
        if (!user) {
            user = await buyerfollower.findOne({ email: email });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(UNAUTHORIZED).json({
                    status: 'fail',
                    message: 'Incorrect email or password',
                });
            }

            const parentBuyer = await buyer.findById(user.parentId);
            return createSendToken(parentBuyer, 200, true, res);
        }
    }
    else if (LoginModel == cro) {
        user = await LoginModel.findOne({ email });
        if (!user) {
            user = await crofollower.findOne({ email: email });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(UNAUTHORIZED).json({
                    status: 'fail',
                    message: 'Incorrect email or password',
                });
            }
            const parentCro = await cro.findById(user.parentId);
            return createSendToken(parentCro, 200, true, res);
        }
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {

        return res.status(500).json({
            status: 'fail',
            message: 'Incorrect email or password',
        });
    }

    const emailVerificationToken = jwt.sign(
        { email: email.toLowerCase(), type: type },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
    if (!user.isVerified) {
        const verificationLink = `${req.protocol}://${req.get("host")}/api/auth/verify-email/${emailVerificationToken}`;
        await sendEmail({
            email: user.email,
            subject: "Verify Your Email - Welcome to Our BioBridgeX Platform!",
            html: emailVerification(user.name, verificationLink),
        });

        return res.status(OK).json({
            status: 'success',
            email: email,
            message: 'Please check your email to verify your account.',
        });
    }

    createSendToken(user, 200, false, res);
};

export const addFollower = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email, type } = req.body;
        if (!email || !type) {
            return res.status(BAD_REQUEST).json({
                status: 'false',
                message: 'Please provide all required fields',
            });
        }
        let FollowerModel;
        let roleLabel;

        switch (type) {
            case 'cro':
                FollowerModel = crofollower;
                roleLabel = 'CRO Follower';
                break;
            case 'buyer':
                FollowerModel = buyerfollower;
                roleLabel = 'Buyer Follower';
                break;
            default:
                return res.status(BAD_REQUEST).json({
                    status: 'fail',
                    message: 'Invalid user type',
                });
        }

        const existingFollower = await FollowerModel.findOne({ email });
        if (existingFollower) {
            return res.status(BAD_REQUEST).json({
                status: 'false',
                message: 'Follower Email already registered',
            });
        }

        const plainPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const profileImage = getAvatarUrl(email);
        const name = email.slice(0, 5);

        const follower = new FollowerModel({
            parentId: userId,
            profileImage,
            name,
            email,
            password: hashedPassword,
        });

        await follower.save();

        const messageHtml = `
         <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <title>You've Been Invited</title>
        </head>
        <body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding: 30px 0;">
            <tr>
                <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                    <tr>
                    <td style="background-color:#4A90E2; padding:20px; text-align:center; color:#ffffff;">
                        <h1 style="margin:0;">Welcome to Our Platform</h1>
                    </td>
                    </tr>
                    <tr>
                    <td style="padding:30px;">
                        <h2 style="color:#333;">You're Invited as a <span style="color:#4A90E2;">${roleLabel}</span></h2>
                        <p style="color:#555; font-size:16px;">We're excited to have you onboard! Below are your login credentials:</p>
                        <table cellpadding="10" cellspacing="0" style="margin:20px 0; background:#f9f9f9; border:1px solid #ddd; border-radius:5px;">
                        <tr>
                            <td style="font-weight:bold;">Email:</td>
                            <td>${email}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:bold;">Password:</td>
                            <td>${plainPassword}</td>
                        </tr>
                        </table>
                        <p style="color:#555; font-size:16px;">Please use these credentials to log in to your account.</p>
                        <div style="text-align:center; margin:30px 0;">
                        <a href="https://biobridgex.com/" target="_blank" style="background-color:#4A90E2; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:5px; font-size:16px;">Log In Now</a>
                        </div>
                        <p style="color:#999; font-size:12px;">If you did not expect this email, please ignore it.</p>
                    </td>
                    </tr>
                    <tr>
                    <td style="background-color:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777;">
                        &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
                    </td>
                    </tr>
                </table>
                </td>
            </tr>
            </table>
        </body>
        </html> `;

        await sendEmail({
            email,
            subject: `Invitation to join as ${roleLabel}`,
            html: messageHtml,
        });

        res.status(OK).json({
            status: 'success',
            message: 'Follower Email added successfully',
            data: { follower },
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

//get all buyerfollowers
export const getAllBuyerFollowers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const followers = await buyerfollower.find({ parentId: userId });
        res.status(OK).json({
            status: 'success',
            data: { followers },
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

//get all crofollowers
export const getAllCroFollowers = async (req, res) => {
    try {
        const userId = req.user.userId;
        const followers = await crofollower.find({ parentId: userId });
        res.status(OK).json({
            status: 'success',
            data: { followers },
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

//delete buyerfollower
export const deleteBuyerFollower = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(BAD_REQUEST).json({
                status: 'false',
                message: 'Please provide all required fields',
            });
        }
        const deletedFollower = await buyerfollower.findByIdAndDelete(id);
        if (!deletedFollower) {
            return res.status(BAD_REQUEST).json({
                status: 'false',
                message: 'Follower not found',
            });
        }
        res.status(OK).json({
            status: 'success',
            message: 'Follower deleted successfully',
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

//delete crofollower
export const deleteCroFollower = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(BAD_REQUEST).json({
                status: 'false',
                message: 'Please provide all required fields',
            });
        }
        const deletedFollower = await crofollower.findByIdAndDelete(id);
        if (!deletedFollower) {
            return res.status(BAD_REQUEST).json({
                status: 'false',
                message: 'Follower not found',
            });
        }
        res.status(OK).json({
            status: 'success',
            message: 'Follower deleted successfully',
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// revoke or grant access admin
export const updateBuyerFollowerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        let user = await buyerfollower.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = status;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User access ${user.status == 1 ? 'granted' : 'revoked'} successfully`,
            data: user
        });

    } catch (error) {
        console.error("Error revoking access:", error);
        res.status(500).json({ error: error.message });
    }
};

// revoke or grant access admin
export const updateCroFollowerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        let user = await crofollower.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = status;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User access ${user.status == 1 ? 'granted' : 'revoked'} successfully`,
            data: user
        });

    } catch (error) {
        console.error("Error revoking access:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(401).json({
                status: 'false',
                message: 'Please provide all required fields',
            });
        }
        const user = await buyer.findById(id);
        if (!user) {
            return res.status(400).json({
                status: 'false',
                message: 'User not found',
            });
        }
        res.status(200).json({
            status: 'success',
            data: { user },
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}