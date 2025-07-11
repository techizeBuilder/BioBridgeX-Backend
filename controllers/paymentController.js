import Payment from '../models/payment.js';
import fs from 'fs/promises';
import path from 'path';
import Project from '../models/project.js';
import mongoose from 'mongoose';
import Quote from '../models/quotes.js';
import User from '../models/admin.js';
import buyer from '../models/buyer.js';
import { NotificationTemplate } from '../utils/EmailTemplates/notificationtemp.js';
import { notificationServiceInstance } from '../utils/socketserver.js';
import sendEmail from '../utils/email.js';
import PurchaseOrder from '../models/purchaseOrder.js';

export const createPayment = async (req, res) => {
    try {
        const { amount, percentage } = req.body;
        const { id } = req.params;
        const quote = await Quote.findById(id);
        const project = await Project.findById(quote.projectId);
        const po = await PurchaseOrder.findOne({ projectId: project._id, croId: quote.croId, buyerId: quote.buyerId });

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        if (!po) {
            return res.status(404).json({ error: "Unable to create payment.\n No PO association found with this quote." });
        }

        const payment = new Payment({
            amount: amount,
            Totalamount: quote.baseStudyCost,
            orderId: null,
            payeeId: project.buyerId,
            projectId: quote.projectId,
            payTo: quote.croId,
            po: po._id,
            milestone: null,
            attatchement: null,
            percentage: percentage,
        });


        const admin = (await User.find({ role: "admin" }).select("_id name email"))
        const adminids = admin.map(user => user._id.toString());
        const bId = await buyer.findOne({ _id: quote.buyerId }).select("_id name email")
        const onlyId = bId?._id.toString();
        adminids.forEach(async (adminid) => {
            notificationServiceInstance.sendUserNotification(adminid, "MILESTONE_DONE", {
                userId: payment._id,
                title: `Project Milestone Done.`,
                description: `${process.env.DOMAIN}/admin/finances`,
            });
        })
        notificationServiceInstance.sendUserNotification(onlyId, "MILESTONE_DONE", {
            userId: payment._id,
            title: `Project Milestone Done.`,
            description: `${process.env.DOMAIN}/buyer/payments`,
        });
        admin.forEach(async (admin) => {
            const mailTemplete = NotificationTemplate(admin.name, "Project Section Status Updated", `Project Section Done - ${payment.milestone}`, "https://oncload.com", "BioBridge")
            const mailOptions = {
                email: admin.email,
                subject: "Project Section Status Updated",
                html: mailTemplete,
            };
            sendEmail(mailOptions)
        })
        const mailTemplete = NotificationTemplate(bId.name, "Project Section Status Updated", `Project Section Done - ${payment.milestone}`, "https://oncload.com", "BioBridge")
        const mailOptions = {
            email: bId.email,
            subject: "Project Section Status Updated",
            html: mailTemplete,
        };
        sendEmail(mailOptions)

        // Save the payment to the database
        const savedPayment = await payment.save();

        // Save the updated quote
        await quote.save();

        res.status(200).json({
            success: true,
            message: 'Payment Created Successfully.',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPaymentsByBuyerId = async (req, res) => {
    const userId = req.user.userId;
    const { q, page = 1, limit = 10 } = req.query;

    try {
        const payments = await Payment.find({ payeeId: userId, status: 'Approved' })
            .populate({
                path: 'projectId',
                model: 'Project'
            })
            .populate({
                path: 'payeeId',

                model: 'buyer'
            })
            .populate({
                path: 'payTo',

                model: 'cro'
            }).skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const totalPayments = await Payment.countDocuments({ payeeId: userId, status: 'Approved' });
        const totalPages = Math.ceil(totalPayments / limit);

        res.json({
            success: true,
            data: payments,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalPayments,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getBuyerPaymentAnalytics = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));

    try {
        const analytics = await Payment.aggregate([
            {
                $match: {
                    payeeId: userId,
                    status: "Approved"
                }
            },
            {
                $facet: {
                    totalPaidAmount: [
                        { $match: { paymentStatus: "Completed" } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ],
                    totalPendingAmountAndCount: [
                        { $match: { paymentStatus: "Pending" } },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$amount" },
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    thisMonthPaid: [
                        {
                            $match: {
                                paymentStatus: "Completed",
                                date: {
                                    $gte: currentMonthStart,
                                    $lt: nextMonthStart
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$amount" },
                                count: { $sum: 1 }
                            }
                        }
                    ],

                }
            }
        ]);


        const result = {
            totalPaidAmount: analytics[0]?.totalPaidAmount[0]?.total || 0,
            totalPendingAmount: analytics[0]?.totalPendingAmountAndCount[0]?.total || 0,
            pendingCount: analytics[0]?.totalPendingAmountAndCount[0]?.count || 0,
            thisMonthPaidAmount: analytics[0]?.thisMonthPaid[0]?.total || 0,
            thisMonthPaidCount: analytics[0]?.thisMonthPaid[0]?.count || 0
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Payment analytics error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// export const getCroPaymentAnalytics = async (req, res) => {
//     const userId = new mongoose.Types.ObjectId(req.user.userId);

//     try {
//         const analytics = await Payment.aggregate([
//             {
//                 $match: {
//                     payTo: userId,
//                 }
//             },
//             {
//                 $facet: {
//                     totalEarnings: [
//                         { $match: { paymentStatus: "Completed" } },
//                         { $group: { _id: null, total: { $sum: "$amount" } } }
//                     ],
//                     totalPendingAmountAndCount: [
//                         { $match: { paymentStatus: "Pending" } },
//                         {
//                             $group: {
//                                 _id: null,
//                                 total: { $sum: "$amount" },
//                                 count: { $sum: 1 }
//                             }
//                         }
//                     ],
//                 }
//             }
//         ]);

//         const result = {
//             totalEarnings: analytics[0]?.totalEarnings[0]?.total || 0,
//             totalPendingAmount: analytics[0]?.totalPendingAmountAndCount[0]?.total || 0,
//             pendingCount: analytics[0]?.totalPendingAmountAndCount[0]?.count || 0,
//         };

//         res.json({
//             success: true,
//             data: result
//         });

//     } catch (error) {
//         console.error("Payment analytics error:", error);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// };
export const getCroPaymentAnalytics = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    try {
        const analytics = await Payment.aggregate([
            {
                $match: {
                    payTo: userId,
                }
            },
            {
                $facet: {
                    totalEarnings: [
                        { $match: { paymentStatus: "Completed" } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ],
                    totalPendingAmountAndCount: [
                        { $match: { paymentStatus: "Pending" } },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$amount" },
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    lastMonthEarnings: [
                        {
                            $match: {
                                paymentStatus: "Completed",
                                createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$amount" }
                            }
                        }
                    ],
                    prevMonthEarnings: [
                        {
                            $match: {
                                paymentStatus: "Completed",
                                createdAt: { $gte: startOfPrevMonth, $lt: startOfLastMonth }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: "$amount" }
                            }
                        }
                    ]
                }
            }
        ]);

        const totalEarnings = analytics[0]?.totalEarnings[0]?.total || 0;
        const totalPendingAmount = analytics[0]?.totalPendingAmountAndCount[0]?.total || 0;
        const pendingCount = analytics[0]?.totalPendingAmountAndCount[0]?.count || 0;
        const lastMonth = analytics[0]?.lastMonthEarnings[0]?.total || 0;
        const prevMonth = analytics[0]?.prevMonthEarnings[0]?.total || 0;

        let increaseByLastMonth = 0;
        if (prevMonth > 0) {
            increaseByLastMonth = ((lastMonth - prevMonth) / prevMonth) * 100;
        }

        res.json({
            success: true,
            data: {
                totalEarnings,
                totalPendingAmount,
                pendingCount,
                increaseByLastMonth: parseFloat(increaseByLastMonth.toFixed(2))
            }
        });
    } catch (error) {
        console.error("Payment analytics error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const getAdminPaymentAnalytics = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    try {
        const analytics = await Payment.aggregate([

            {
                $facet: {
                    grossTxnVolume: [
                        { $match: { paymentStatus: "Completed" } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ],
                }
            }
        ]);

        const result = {
            totalGrossTxnVolume: analytics[0]?.grossTxnVolume[0]?.total || 0,
            totalPlatformFees: analytics[0]?.grossTxnVolume[0]?.total * 0.02 || 0,
            collectedFees: analytics[0]?.grossTxnVolume[0]?.count * 0.02 || 0,
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Payment analytics error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get all payments
export const getAllPayments = async (req, res) => {
    const { q, page = 1, limit = 10 } = req.query;

    try {
        const payments = await Payment.find().populate({
            path: 'projectId',
            select: 'title',
            model: 'Project',

        }).populate({
            path: 'payeeId',
            select: 'name',
            model: 'buyer',

        }).populate({
            path: 'payTo',
            select: 'name',
            model: 'cro',

        }).skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const totalPayments = await Payment.countDocuments();
        const totalPages = Math.ceil(totalPayments / limit);
        const paymentList = payments.map((payment) => ({
            "_id": payment._id,
            "amount": payment.amount,
            "Totalamount": payment.Totalamount,
            "orderId": payment.orderId,
            "buyerDetails": [{
                "_id": payment.payeeId._id,
                "name": payment.payeeId.name
            }],
            "projectDetails": [{
                "_id": payment.projectId._id,
                "title": payment.projectId.title
            }],
            "croDetails": [{
                "_id": payment.payTo._id,
                "name": payment.payTo.name
            }],
            "status": payment.status,
            "paymentStatus": payment.paymentStatus,
            "milestone": payment.milestone,
            "attatchement": payment.attatchement,
            "percentage": payment.percentage,
            "date": payment.date,
            "croConfirmationStatus": payment.croConfirmationStatus,
        }));

        res.json({
            success: true,
            data: paymentList,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalPayments,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get payments by CRO ID
export const getPaymentsByCroId = async (req, res) => {
    const { q, page = 1, limit = 10 } = req.query;

    try {
        const userId = req.user.userId;
        const payments = await Payment.find({ payTo: userId }).populate({
            path: 'projectId',
            model: 'Project'
        })
            .populate({
                path: 'payeeId',
                model: 'buyer'
            })
            .populate({
                path: 'payTo',
                model: 'cro'
            }).skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const totalPayments = await Payment.countDocuments({ payTo: userId });
        const totalPages = Math.ceil(totalPayments / limit);
        res.json({
            success: true,
            data: payments,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalPayments,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upload attachment for a payment
export const uploadAttachment = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const payment = await Payment.findById(req.params.paymentId);


        if (!payment) {
            await fs.unlink(req.file.path);
            return res.status(404).json({ error: 'Payment not found' });
        }

        const fileUrl = `/public/uploads/${req.file.filename}`;
        payment.attatchement = fileUrl;
        payment.updatedAt = new Date();
        await payment.save();

        res.json({
            success: true,
            message: 'Attachment uploaded successfully',
            data: payment
        });
    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
};

// Update attachment for a payment
export const updateAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) {
            await fs.unlink(req.file.path);
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Delete old file if it exists
        if (payment.attatchement) {
            const oldFilePath = new URL(payment.attatchement).pathname;
            try {
                await fs.unlink(path.join(process.cwd(), oldFilePath));
            } catch (error) {
                console.error('Error deleting old file:', error);
            }
        }

        const fileUrl = `/public/uploads/${req.file.filename}`;

        payment.attatchement = fileUrl;
        payment.updatedAt = new Date();
        await payment.save();

        res.json({
            success: true,
            message: 'Attachment updated successfully',
            data: payment
        });
    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            {
                status: req.body.status,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({
            message: 'Payment Status updated successfully',
            payment: {
                _id: payment._id,
                status: payment.status,
                updatedAt: payment.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Update payment processing status
export const updatePaymentProcessingStatus = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            {
                paymentStatus: req.body.paymentStatus,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({
            message: 'Payment paymentStatus updated successfully',
            payment: {
                _id: payment._id,
                paymentStatus: payment.paymentStatus,
                updatedAt: payment.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCroConfirmationStatus = async (req, res) => {
    try {

        const payement = await Payment.findByIdAndUpdate(
            req.params.id,
            {
                croConfirmationStatus: "Received",
                updatedAt: new Date()
            },
            { new: true }
        );
        if (!payement) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json({
            message: 'Confirmation status updated successfully',
            payment: {
                _id: payement._id,
                croConfirmationStatus: payement.croConfirmationStatus,
                updatedAt: payement.updatedAte
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// search payments
export const searchPayments = async (req, res) => {
    const { q, status, page = 1, limit = 10 } = req.query;
    try {
        const payments = await Payment.aggregate([
            {
                $lookup: {
                    from: "projects",
                    localField: "projectId",
                    foreignField: "_id",
                    as: "projectDetails",
                },
            },
            {
                $lookup: {
                    from: "buyers",
                    localField: "payeeId",
                    foreignField: "_id",
                    as: "buyerDetails",
                },
            },
            {
                $lookup: {
                    from: "cros",
                    localField: "payTo",
                    foreignField: "_id",
                    as: "croDetails",
                },
            },
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { "projectDetails.title": { $regex: q, $options: "i" } },
                                { "buyerDetails.name": { $regex: q, $options: "i" } },
                                { "croDetails.name": { $regex: q, $options: "i" } },],
                        },
                        ...(status ? [{ status: status }] : []),
                    ],
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
        ])
        const totalPayments = await Payment.aggregate([
            {
                $lookup: {
                    from: "projects",
                    localField: "projectId",
                    foreignField: "_id",
                    as: "projectDetails",
                },
            },
            {
                $lookup: {
                    from: "buyers",
                    localField: "payeeId",
                    foreignField: "_id",
                    as: "buyerDetails",
                },
            },
            {
                $lookup: {
                    from: "cros",
                    localField: "payTo",
                    foreignField: "_id",
                    as: "croDetails",
                },
            },
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                { "projectDetails.title": { $regex: q, $options: "i" } },
                                { "buyerDetails.name": { $regex: q, $options: "i" } },
                                { "croDetails.name": { $regex: q, $options: "i" } },
                            ],
                        },
                        ...(status ? [{ status: status }] : []),
                    ],
                },
            },
            { $count: "total" },
        ]);
        const totalPaymentsCount = totalPayments.length > 0 ? totalPayments[0].total : 0;
        const totalPages = Math.ceil(totalPaymentsCount / limit);

        res.json({
            success: true,
            data: payments,
            pagination: {
                currentPage: parseInt(page),
                totalPages,

                totalPayments: totalPaymentsCount,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};