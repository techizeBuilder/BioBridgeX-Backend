import mongoose from 'mongoose';
import Project from '../models/project.js';
import Quote from '../models/quotes.js';
import Payment from '../models/payment.js';
import cro from '../models/cro.js';
import bcrypt from 'bcryptjs';
import PurchaseOrder from '../models/purchaseOrder.js';
import OrganizationProfile from '../models/organizationProfile.js';

export const getAllCroAssingProject = async (req, res) => {
    try {
        const { userId } = req.user;
        const { page = 1, limit = 10 } = req.query;
        const projects = await Project.aggregate([
            {
                $match: {
                    assignedTo: { $in: [new mongoose.Types.ObjectId(userId)] }
                }
            },
            {
                $lookup: {
                    from: 'buyers',
                    localField: 'buyerId',
                    foreignField: '_id',
                    as: 'buyer'
                }
            },
            {
                $unwind: {
                    path: '$buyer',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            { $skip: (page - 1) * parseInt(limit) },
            { $limit: parseInt(limit) }
        ]);

        const totalProjects = await Project.countDocuments({
            assignedTo: { $in: [new mongoose.Types.ObjectId(userId)] }
        });

        const totalPages = Math.ceil(totalProjects / limit);

        res.json({
            success: true,
            projects,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProjects,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// export const getCRODashboardAnalytics = async (req, res) => {
//     const userId = new mongoose.Types.ObjectId(req.user.userId);
//     try {
//         const analytics = await Project.aggregate([
//             {
//                 $match: {
//                     assignedTo: { $in: [userId] }
//                 }
//             },
//             {
//                 $facet: {
//                     totalActiveProjects: [
//                         {
//                             $match: {
//                                 status: "Approved",
//                                 projectComplitionStatus: { $in: ["Pending", "InProgress"] }
//                             }
//                         },
//                         { $count: "count" }
//                     ],
//                     onTrackProjects: [
//                         { $match: { status: "Approved", projectComplitionStatus: "InProgress" } },
//                         { $count: "count" }
//                     ],
//                     pendingProjects: [
//                         { $match: { status: "Approved", projectComplitionStatus: "Pending" } },
//                         { $count: "count" }
//                     ]
//                 }
//             }
//         ]);

//         const quotesAnalytics = await Quote.aggregate([
//             {
//                 $facet: {
//                     pendingQuotes: [
//                         { $match: { buyerStatus: "Pending" } },
//                         { $count: "count" }
//                     ],
//                     totalAcceptedRejectedQuotes: [
//                         { $match: { buyerStatus: { $in: ["Approved", "Rejected"] } } },
//                         { $count: "count" }
//                     ],
//                     approvedQuotes: [
//                         { $match: { buyerStatus: "Approved" } },
//                         { $count: "count" }
//                     ]
//                 }
//             }
//         ]);

//         const totalActiveProjects = analytics[0]?.totalActiveProjects[0]?.count || 0;
//         const onTrackProjects = analytics[0]?.onTrackProjects[0]?.count || 0;
//         const pendingProjects = analytics[0]?.pendingProjects[0]?.count || 0;
//         const pendingQuotes = quotesAnalytics[0]?.pendingQuotes[0]?.count || 0;
//         const totalAcceptedRejectedQuotes = quotesAnalytics[0]?.totalAcceptedRejectedQuotes[0]?.count || 0;
//         const approvedQuotes = quotesAnalytics[0]?.approvedQuotes[0]?.count || 0;

//         const quoteSuccessRate = totalAcceptedRejectedQuotes > 0
//             ? (approvedQuotes / totalAcceptedRejectedQuotes) * 100
//             : 0;

//         const result = {
//             totalActiveProjects,
//             onTrackProjects,
//             pendingProjects,
//             pendingQuotes,
//             quoteSuccessRate
//         };

//         res.json({
//             success: true,
//             data: result
//         });

//     } catch (error) {
//         console.error("Dashboard analytics error:", error);
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// };
export const getCRODashboardAnalytics = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // 👉 Date boundaries for quote month-wise calculation
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    try {
        const analytics = await Project.aggregate([
            {
                $match: {
                    assignedTo: { $in: [userId] }
                }
            },
            {
                $facet: {
                    totalActiveProjects: [
                        {
                            $match: {
                                status: "Approved",
                                projectComplitionStatus: { $in: ["Pending", "InProgress"] }
                            }
                        },
                        { $count: "count" }
                    ],
                    onTrackProjects: [
                        { $match: { status: "Approved", projectComplitionStatus: "InProgress" } },
                        { $count: "count" }
                    ],
                    pendingProjects: [
                        { $match: { status: "Approved", projectComplitionStatus: "Pending" } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const quotesAnalytics = await Quote.aggregate([
            {
                $facet: {
                    pendingQuotes: [
                        { $match: { buyerStatus: "Pending" } },
                        { $count: "count" }
                    ],
                    totalAcceptedRejectedQuotes: [
                        { $match: { buyerStatus: { $in: ["Approved", "Rejected"] } } },
                        { $count: "count" }
                    ],
                    approvedQuotes: [
                        { $match: { buyerStatus: "Approved" } },
                        { $count: "count" }
                    ],

                    // 👉 Last month data
                    lastMonthApproved: [
                        {
                            $match: {
                                buyerStatus: "Approved",
                                createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }
                            }
                        },
                        { $count: "count" }
                    ],
                    lastMonthTotal: [
                        {
                            $match: {
                                buyerStatus: { $in: ["Approved", "Rejected"] },
                                createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth }
                            }
                        },
                        { $count: "count" }
                    ],

                    // 👉 Prev month data
                    prevMonthApproved: [
                        {
                            $match: {
                                buyerStatus: "Approved",
                                createdAt: { $gte: startOfPrevMonth, $lt: startOfLastMonth }
                            }
                        },
                        { $count: "count" }
                    ],
                    prevMonthTotal: [
                        {
                            $match: {
                                buyerStatus: { $in: ["Approved", "Rejected"] },
                                createdAt: { $gte: startOfPrevMonth, $lt: startOfLastMonth }
                            }
                        },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const totalActiveProjects = analytics[0]?.totalActiveProjects[0]?.count || 0;
        const onTrackProjects = analytics[0]?.onTrackProjects[0]?.count || 0;
        const pendingProjects = analytics[0]?.pendingProjects[0]?.count || 0;
        const pendingQuotes = quotesAnalytics[0]?.pendingQuotes[0]?.count || 0;

        const totalAcceptedRejectedQuotes =
            quotesAnalytics[0]?.totalAcceptedRejectedQuotes[0]?.count || 0;
        const approvedQuotes = quotesAnalytics[0]?.approvedQuotes[0]?.count || 0;

        const quoteSuccessRate =
            totalAcceptedRejectedQuotes > 0
                ? (approvedQuotes / totalAcceptedRejectedQuotes) * 100
                : 0;

        // 👉 last and previous month quote success rates
        const lastMonthApproved = quotesAnalytics[0]?.lastMonthApproved[0]?.count || 0;
        const lastMonthTotal = quotesAnalytics[0]?.lastMonthTotal[0]?.count || 0;
        const prevMonthApproved = quotesAnalytics[0]?.prevMonthApproved[0]?.count || 0;
        const prevMonthTotal = quotesAnalytics[0]?.prevMonthTotal[0]?.count || 0;

        const lastMonthRate =
            lastMonthTotal > 0 ? (lastMonthApproved / lastMonthTotal) * 100 : 0;
        const prevMonthRate =
            prevMonthTotal > 0 ? (prevMonthApproved / prevMonthTotal) * 100 : 0;

        let quoteSuccessRateIncreaseByLastMonth = 0;
        if (prevMonthRate > 0) {
            quoteSuccessRateIncreaseByLastMonth =
                ((lastMonthRate - prevMonthRate) / prevMonthRate) * 100;
        }

        const result = {
            totalActiveProjects,
            onTrackProjects,
            pendingProjects,
            pendingQuotes,
            quoteSuccessRate: parseFloat(quoteSuccessRate.toFixed(2)),
            quoteSuccessRateIncreaseByLastMonth: parseFloat(
                quoteSuccessRateIncreaseByLastMonth.toFixed(2)
            )
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Dashboard analytics error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const getCROAnalytics = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    try {
        const currentYear = new Date().getFullYear();

        const quotesData = await Quote.aggregate([
            {
                $match: {
                    croId: userId,
                    createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const projectsData = await Project.aggregate([
            {
                $match: {
                    assignedTo: { $in: [userId] },
                    createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const revenueData = await Payment.aggregate([
            {
                $match: {
                    payTo: userId,
                    paymentStatus: "Completed",
                    date: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) }
                }
            },
            {
                $group: {
                    _id: { $month: "$date" },
                    totalRevenue: { $sum: "$amount" }
                }
            }
        ]);


        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        const data = months.map((name, index) => {
            const monthIndex = index + 1;
            const quotes = quotesData.find(q => q._id === monthIndex)?.count || 0;
            const projects = projectsData.find(p => p._id === monthIndex)?.count || 0;
            const revenue = revenueData.find(r => r._id === monthIndex)?.totalRevenue || 0;
            return { name, quotes, projects, revenue };
        });

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error("Dashboard analytics error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const getCroProfile = async (req, res) => {
    try {
        const { userId } = req.user;
        const croProfile = await cro.findById(userId).select("-password");
        if (!croProfile) {
            return res.status(404).json({ success: false, message: "CRO profile not found" });
        }
        res.json({ success: true, data: croProfile });
    } catch (error) {
        console.error("Error fetching CRO profile:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateCroProfile = async (req, res) => {
    try {
        const { userId } = req.user;

        const { newPassword, currentPassword, phoneNumber, organizationName, businessAddress } = req.body;

        const updateData = { phoneNumber, organizationName, businessAddress };

        if (newPassword && currentPassword) {
            const croProfile = await cro.findById(userId);
            if (!croProfile) {
                return res.status(404).json({ success: false, message: "CRO profile not found" });
            }
            const isMatch = await bcrypt.compare(currentPassword, croProfile.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Current password is incorrect" });
            }
            if (newPassword === currentPassword) {
                return res.status(400).json({ success: false, message: "New password must be different from the current password" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
            }
            updateData.password = await bcrypt.hash(newPassword, 10);
        } else if ((newPassword && !currentPassword) || (!newPassword && currentPassword)) {
            return res.status(400).json({ success: false, message: "Current password and New password is required to update the user password" });
        }

        const updatedProfile = await cro.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select("-password");
        await OrganizationProfile.findOneAndUpdate(
            { croId: userId },
            {
                organizationName: organizationName,
                billingAddress: businessAddress
            },
            { new: true }
        );
        if (!updatedProfile) {
            return res.status(404).json({ success: false, message: "CRO profile not found" });
        }

        res.json({ success: true, data: updatedProfile });
    } catch (error) {
        console.error("Error updating CRO profile:", error);
        res.status(500).json({ success: false, message: "Failed to update CRO profile", error: error.message });
    }
};