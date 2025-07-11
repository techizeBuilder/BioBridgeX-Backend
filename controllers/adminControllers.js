import cro from '../models/cro.js';
import Project from '../models/project.js';
import buyer from '../models/buyer.js';
import Payment from '../models/payment.js';
import AdminSetting from "../models/siteSettings.js";
import Dispute from '../models/dispute.js';
import bcrypt from 'bcryptjs';
import User from '../models/admin.js';
import { notificationServiceInstance } from '../utils/socketserver.js';
import sendEmail from '../utils/email.js';
import { NotificationTemplate } from '../utils/EmailTemplates/notificationtemp.js';
import jwt from "jsonwebtoken";
import OrganizationProfile from '../models/organizationProfile.js';
import ContactUs from '../models/contactUs.js';
import AppointmentBooking from '../models/appointmentBooking.js';
import chats from "../models/chat.js"
const getAvatarUrl = (seed, style = "adventurer") => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
};

export const assignProjectToCROs = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { croIds } = req.body;
        const { userId } = req.user
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Validate all CROs exist
        const cros = await cro.find({ _id: { $in: croIds } });
        if (cros.length !== croIds.length) {
            return res.status(400).json({
                success: false,
                error: 'One or more CRO IDs are invalid'
            });
        }
        project.assignedTo = croIds;
        project.updatedAt = new Date();


        const crouser = await cro.find({ _id: { $in: croIds } }).select("_id name email")
        const cId = crouser.map(user => user._id.toString());
        cId.forEach(async (croId) => {
            notificationServiceInstance.sendUserNotification(croId, "PROJECT_RECEIVED_FROM_ADMIN", {
                userId: croId,
                title: `Project Received from BioBridgeX - ${project.title}`,
                description: `${process.env.DOMAIN}/cro/projects/${project._id}`,

            });
        })

        crouser.forEach((cro) => {
            const mailTemplete = NotificationTemplate(cro.name, "New Project Created", project.title, "https://oncload.com", "BioBridge")
            const mailOptions = {
                email: cro.email,
                subject: "New Project Assigned",
                html: mailTemplete,
            };
            sendEmail(mailOptions)
        })

        await project.save();
        const bId = await buyer.findOne({ _id: project.buyerId }).select("_id name email")
        const onlyId = bId?._id.toString();

        notificationServiceInstance.sendUserNotification(onlyId, "BUYER_PROJECT_STATUS_UPDATE_FROM_ADMIN", {
            userId: onlyId,
            title: `Project Approved - ${project.title}`,
            description: `${process.env.DOMAIN}/buyer/projects?tab=Approved`,
        });

        const mailTemplete = NotificationTemplate(bId.name, "Project Approved By Admin", `Project Approved By Admin- ${userId}`, "https://oncload.com", "BioBridge")
        const mailOptions = {
            email: bId.email,
            subject: "Project Approved By Admin",
            html: mailTemplete,
        };
        sendEmail(mailOptions)

        res.json({
            success: true,
            message: "Project assigned to CROs successfully",
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const getAllCros = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const cros = await cro.find().skip((page - 1) * limit)
            .limit(parseInt(limit)).sort({ createdAt: -1 });

        const totalCros = await cro.countDocuments();
        const totalPages = Math.ceil(totalCros / limit);
        res.json({
            status: true, cros, pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCros,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllBuyer = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const cros = await buyer.find().skip((page - 1) * limit)
            .limit(parseInt(limit)).sort({ createdAt: -1 });
        const totalBuyers = await buyer.countDocuments();
        const totalPages = Math.ceil(totalBuyers / limit);
        res.json({
            status: true, cros, pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalBuyers,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const searchBuyerByName = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;

        const buyers = await buyer.find({
            name: { $regex: q, $options: "i" }
        })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const totalBuyers = await buyer.countDocuments({
            name: { $regex: q, $options: "i" }
        });

        const totalPages = Math.ceil(totalBuyers / limit);

        res.status(200).json({
            success: true,
            buyers,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalBuyers,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const searchCroByName = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;

        const cros = await cro.find({
            name: { $regex: q, $options: "i" }
        })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const totalCros = await cro.countDocuments({
            name: { $regex: q, $options: "i" }
        });

        const totalPages = Math.ceil(totalCros / limit);

        res.status(200).json({
            success: true,
            cros,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCros,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProjectStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params
        const { userId } = req.user

        const project = await Project.findByIdAndUpdate(
            { _id: id },
            { status, approvedBy: userId },

            { new: true }
        );
        const bId = await buyer.findOne({ _id: project.buyerId }).select("_id name email")
        const onlyId = bId?._id.toString();

        notificationServiceInstance.sendUserNotification(onlyId, "BUYER_PROJECT_STATUS_UPDATE_FROM_ADMIN", {
            userId: onlyId,
            title: `Project In Review - ${project.title}`,
            description: `${process.env.DOMAIN}/buyer/projects?tab=Approved`,
        });

        const mailTemplete = NotificationTemplate(bId.name, "Project Accepted To Assign By Admin", `Project Accepted To Assign By Admin- ${userId}`, "https://oncload.com", "BioBridge")
        const mailOptions = {
            email: bId.email,
            subject: "Project Accepted To Assign By Admin",
            html: mailTemplete,
        };
        sendEmail(mailOptions)
        res.json({
            success: true,
            message: 'Project status updated successfully',
            data: project
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const toggleAdminVerification = async (req, res) => {
    const { id } = req.params;

    try {
        let user = await buyer.findById(id);
        let modelName = 'buyer';

        if (!user) {
            user = await cro.findById(id);
            modelName = 'cro';
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found in buyer or cro collection.' });
        }
        const organization = await OrganizationProfile.findOne({ croId: id });

        if (organization) {
            organization.VerifyStatus = "Approved";
            await organization.save();
        }
        // Toggle adminVerified
        user.adminVerified = !user.adminVerified;
        await user.save();

        return res.status(200).json({
            message: `${modelName} verified successfully by Admin.`,
            user,
            organization
        });

    } catch (error) {
        console.error("Error toggling admin verification:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};

// export const getAdminDashboardAnalytics = async (req, res) => {
//     const now = new Date();
//     const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
//     const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));

//     try {

//         const buyerData = await buyer.find();
//         const croData = await cro.find();
//         const projectAnalytics = await Project.aggregate([
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
//                     completedProjects: [
//                         {
//                             $match: {
//                                 status: "Approved",
//                                 projectComplitionStatus: "Completed"
//                             }
//                         },
//                         { $count: "count" }
//                     ],
//                     pendingProjects: [
//                         { $match: { status: "Approved", projectComplitionStatus: "Pending" } },
//                         { $count: "count" }
//                     ]
//                 }
//             }

//         ]

//         );

//         const paymentAnalytics = await Payment.aggregate([

//             {
//                 $facet: {
//                     grossTxnVolume: [
//                         {
//                             $match: {
//                                 paymentStatus: "Completed", date: {
//                                     $gte: currentMonthStart,
//                                     $lt: nextMonthStart
//                                 }
//                             }
//                         },
//                         { $group: { _id: null, total: { $sum: "$amount" } } }
//                     ],
//                 }
//             }
//         ]);

//         const result = {
//             totalUsers: buyerData.length + croData.length,
//             buyers: buyerData.length,
//             cros: croData.length,
//             totalActiveProjects: projectAnalytics[0]?.totalActiveProjects[0]?.count || 0,
//             completedProjects: projectAnalytics[0]?.completedProjects[0]?.count || 0,
//             openDisputes: 0,
//             monthlyRevenue: paymentAnalytics[0]?.grossTxnVolume[0]?.total || 0,
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
export const getAdminDashboardAnalytics = async (req, res) => {
    const now = new Date();

    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));

    const lastMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    const lastMonthEnd = currentMonthStart;

    try {
        const [buyerData, croData] = await Promise.all([buyer.find(), cro.find()]);

        // Current Active Projects Count
        const currentActiveProjects = await Project.countDocuments({
            status: "Approved",
            projectComplitionStatus: { $in: ["Pending", "InProgress"] },
            createdAt: { $gte: currentMonthStart, $lt: nextMonthStart }
        });

        // Last Month Active Projects Count
        const lastActiveProjects = await Project.countDocuments({
            status: "Approved",
            projectComplitionStatus: { $in: ["Pending", "InProgress"] },
            createdAt: { $gte: lastMonthStart, $lt: lastMonthEnd }
        });

        // Current Month Revenue
        const currentPayments = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: "Completed",
                    date: { $gte: currentMonthStart, $lt: nextMonthStart }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const currentRevenue = currentPayments[0]?.total || 0;

        // Last Month Revenue
        const lastPayments = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: "Completed",
                    date: { $gte: lastMonthStart, $lt: lastMonthEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const lastRevenue = lastPayments[0]?.total || 0;

        // Project summary (overall)
        const projectAnalytics = await Project.aggregate([
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
                    completedProjects: [
                        {
                            $match: {
                                status: "Approved",
                                projectComplitionStatus: "Completed"
                            }
                        },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        // Percentage or delta change calculations
        const activeProjectGrowth =
            lastActiveProjects > 0
                ? ((currentActiveProjects - lastActiveProjects) / lastActiveProjects) * 100
                : 0;

        const revenueGrowth =
            lastRevenue > 0
                ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
                : 0;

        const result = {
            totalUsers: buyerData.length + croData.length,
            buyers: buyerData.length,
            cros: croData.length,
            totalActiveProjects: projectAnalytics[0]?.totalActiveProjects[0]?.count || 0,
            completedProjects: projectAnalytics[0]?.completedProjects[0]?.count || 0,
            openDisputes: 0,
            monthlyRevenue: currentRevenue,
            activeProjectGrowth: parseFloat(activeProjectGrowth.toFixed(2)),
            monthlyRevenueGrowth: parseFloat(revenueGrowth.toFixed(2))
        };

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Admin dashboard analytics error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const getAdminDashboardStats = async (req, res) => {
    try {
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
        const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

        // Total Revenue
        const revenueData = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: "Completed",
                    date: { $gte: currentMonthStart, $lt: nextMonthStart },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                },
            },
        ]);

        const lastMonthRevenueData = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: "Completed",
                    date: { $gte: lastMonthStart, $lt: currentMonthStart },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                },
            },
        ]);

        const totalRevenue = revenueData[0]?.totalRevenue || 0;
        const lastMonthRevenue = lastMonthRevenueData[0]?.totalRevenue || 0;
        const revenueChange = lastMonthRevenue
            ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        // Active Projects
        const activeProjectsData = await Project.aggregate([
            {
                $match: {
                    status: "Approved",
                    projectComplitionStatus: { $in: ["Pending", "InProgress"] },
                },
            },
            {
                $count: "activeProjects",
            },
        ]);

        const lastMonthActiveProjectsData = await Project.aggregate([
            {
                $match: {
                    status: "Approved",
                    projectComplitionStatus: { $in: ["Pending", "InProgress"] },
                    updatedAt: { $gte: lastMonthStart, $lt: currentMonthStart },
                },
            },
            {
                $count: "activeProjects",
            },
        ]);

        const activeProjects = activeProjectsData[0]?.activeProjects || 0;
        const lastMonthActiveProjects = lastMonthActiveProjectsData[0]?.activeProjects || 0;
        const activeProjectsChange = lastMonthActiveProjects
            ? ((activeProjects - lastMonthActiveProjects) / lastMonthActiveProjects) * 100
            : 0;

        // Average Project Duration
        const avgProjectDurationData = await Project.aggregate([
            {
                $match: {
                    projectComplitionStatus: "Completed",
                },
            },
            {
                $project: {
                    duration: {
                        $divide: [
                            { $subtract: ["$projectEndDate", "$projectStartDate"] },
                            1000 * 60 * 60 * 24 * 30,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    avgDuration: { $avg: "$duration" },
                },
            },
        ]);

        const lastMonthAvgProjectDurationData = await Project.aggregate([
            {
                $match: {
                    projectComplitionStatus: "Completed",
                    updatedAt: { $gte: lastMonthStart, $lt: currentMonthStart },
                },
            },
            {
                $project: {
                    duration: {
                        $divide: [
                            { $subtract: ["$projectEndDate", "$projectStartDate"] },
                            1000 * 60 * 60 * 24 * 30,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    avgDuration: { $avg: "$duration" },
                },
            },
        ]);

        const avgProjectDuration = avgProjectDurationData[0]?.avgDuration || 0;
        const lastMonthAvgProjectDuration = lastMonthAvgProjectDurationData[0]?.avgDuration || 0;
        const avgProjectDurationChange = lastMonthAvgProjectDuration
            ? ((avgProjectDuration - lastMonthAvgProjectDuration) / lastMonthAvgProjectDuration) * 100
            : 0;

        // Response
        res.status(200).json({
            success: true,
            data: {
                totalRevenue: {
                    value: totalRevenue,
                    change: revenueChange.toFixed(2),
                },
                activeProjects: {
                    value: activeProjects,
                    change: activeProjectsChange.toFixed(2),
                },
                avgProjectDuration: {
                    value: avgProjectDuration.toFixed(2),
                    change: avgProjectDurationChange.toFixed(2),
                },
            },
        });
    } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch admin dashboard stats",
            error: error.message,
        });
    }
};

export const getRevenueTrendsAndCategories = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const revenueTrends = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: "Completed",
                    date: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: "$date" },
                    totalRevenue: { $sum: "$amount" },
                    projectCount: { $addToSet: "$projectId" },
                },
            },
            {
                $project: {
                    month: "$_id",
                    totalRevenue: 1,
                    projectCount: { $size: "$projectCount" },
                    _id: 0,
                },
            },
            { $sort: { month: 1 } },
        ]);

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const formattedRevenueTrends = revenueTrends.map((data) => ({
            month: months[data.month - 1],
            revenue: data.totalRevenue,
            projects: data.projectCount,
        }));


        const categoryDistribution = await Project.aggregate([
            {
                $group: {
                    _id: "$serviceCategory",
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    name: "$_id",
                    value: "$count",
                    _id: 0,
                },
            },
        ]);

        const totalCount = categoryDistribution.reduce((sum, category) => sum + category.value, 0);

        const categoryDistributionWithPercentage = categoryDistribution.map((category) => ({
            ...category,
            percentage: ((category.value / totalCount) * 100).toFixed(2),
        }));

        res.status(200).json({
            success: true,
            data: {
                revenueTrends: formattedRevenueTrends,
                categoryDistribution: categoryDistributionWithPercentage,
            },
        });
    } catch (error) {
        console.error("Error fetching revenue trends and categories:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch revenue trends and categories",
            error: error.message,
        });
    }
};

export const getTopBuyersAndCROs = async (req, res) => {
    try {

        const topBuyersData = await Payment.aggregate([
            {
                $lookup: {
                    from: "buyers",
                    localField: "payeeId",
                    foreignField: "_id",
                    as: "buyerDetails",
                },
            },
            { $unwind: "$buyerDetails" },
            {
                $group: {
                    _id: "$payeeId",
                    name: { $first: "$buyerDetails.name" },
                    spend: { $sum: "$amount" },
                    projects: { $addToSet: "$projectId" },
                },
            },
            {
                $project: {
                    name: 1,
                    spend: 1,
                    projects: { $size: "$projects" },
                },
            },
            { $sort: { spend: -1 } },
            { $limit: 3 },
        ]);

        const topBuyers = topBuyersData.map(buyer => ({
            name: buyer.name,
            spend: buyer.spend,
            projects: buyer.projects,
        }));

        const topCROsData = await Payment.aggregate([
            {
                $lookup: {
                    from: "cros",
                    localField: "payTo",
                    foreignField: "_id",
                    as: "croDetails",
                },
            },
            { $unwind: "$croDetails" },
            {
                $group: {
                    _id: "$payTo",
                    name: { $first: "$croDetails.name" },
                    revenue: { $sum: "$amount" },
                    projects: { $addToSet: "$projectId" },
                },
            },
            {
                $project: {
                    name: 1,
                    revenue: 1,
                    projects: { $size: "$projects" },
                },
            },
            { $sort: { revenue: -1 } },
            { $limit: 3 },
        ]);

        const topCROs = topCROsData.map(cro => ({
            name: cro.name,
            revenue: cro.revenue,
            projects: cro.projects,
        }));

        res.status(200).json({ topBuyers, topCROs });
    } catch (error) {
        console.error("Error fetching top buyers and CROs:", error);
        res.status(500).json({ error: "Failed to fetch data" });
    }
};

export const getProjectTrendsAndUserActivity = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const projectTrends = await Project.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    projectCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    month: "$_id",
                    projectCount: 1,
                    _id: 0,
                },
            },
            { $sort: { month: 1 } },
        ]);

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const formattedProjectTrends = months.map((name, index) => {
            const monthData = projectTrends.find((data) => data.month === index + 1);
            return { month: name, projects: monthData?.projectCount || 0 };
        });

        const buyerActivity = await buyer.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    buyerCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    month: "$_id",
                    buyerCount: 1,
                    _id: 0,
                },
            },
        ]);

        const croActivity = await cro.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    croCount: { $sum: 1 },
                },
            },
            {
                $project: {
                    month: "$_id",
                    croCount: 1,
                    _id: 0,
                },
            },
        ]);

        const userActivityData = months.map((name, index) => {
            const buyerData = buyerActivity.find((data) => data.month === index + 1);
            const croData = croActivity.find((data) => data.month === index + 1);
            return {
                month: name,
                buyers: buyerData?.buyerCount || 0,
                cros: croData?.croCount || 0,
            };
        });

        res.status(200).json({
            success: true,
            data: {
                projectTrends: formattedProjectTrends,
                userActivity: userActivityData,
            },
        });
    } catch (error) {
        console.error("Error fetching project trends and user activity:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch project trends and user activity",
            error: error.message,
        });
    }
};

export const getCommissionEarnings = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const platformFeePercentage = 2;
        console.log(platformFeePercentage)
        const commissionEarnings = await Payment.aggregate([
            {
                $match: {
                    paymentStatus: "Completed",
                    date: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`),
                    },
                },
            },
            {
                $group: {
                    _id: { $month: "$date" },
                    totalPlatformFees: { $sum: { $multiply: ["$amount", platformFeePercentage] } },
                },
            },
            {
                $project: {
                    month: "$_id",
                    totalPlatformFees: { $round: ["$totalPlatformFees", 2] },
                    _id: 0,
                },
            },
            { $sort: { month: 1 } },
        ]);

        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const formattedCommissionEarnings = months.map((name, index) => {
            const monthData = commissionEarnings.find((data) => data.month === index + 1);
            return { month: name, commission: monthData?.totalPlatformFees || 0 };
        });

        res.status(200).json({
            success: true,
            data: formattedCommissionEarnings,
        });
    } catch (error) {
        console.error("Error fetching commission earnings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch commission earnings",
            error: error.message,
        });
    }
};

//get admin settings
export const getAdminSettings = async (req, res) => {
    try {
        const settings = await AdminSetting.findOne();

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: "Admin settings not found",
            });
        }

        res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error("Error fetching admin settings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch admin settings",
            error: error.message,
        });
    }
};

//get landingpage heading
export const getLandingPageHeading = async (req, res) => {
    try {
        const settings = await AdminSetting.findOne();
        if (!settings || !settings.landingPage || !settings.landingPage.headingName) {
            return res.status(404).json({
                success: false,
                message: "Landing page heading not found",
            });
        }
        res.status(200).json({
            success: true,
            data: settings.landingPage.headingName,
        });
    } catch (error) {
        console.error("Error fetching landing page heading:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch landing page heading",
            error: error.message,
        });
    }
};

//update admin settings
export const updateAdminSettings = async (req, res) => {
    try {
        const { general: generalString, fees: feeString, landingPage: landingPageString, maintenanceMode } = req.body;

        const general = generalString ? JSON.parse(generalString) : null;
        const fees = feeString ? JSON.parse(feeString) : null;
        const landingPage = landingPageString ? JSON.parse(landingPageString) : null;

        let settings = await AdminSetting.findOne();

        if (!settings) {
            settings = new AdminSetting();
        }

        if (general) {
            if (req.file) {
                const fileUrl = `/public/uploads/${req.file.filename}`;
                general.siteLogo = fileUrl;
            } else {
                console.log("No file uploaded for siteLogo.");
            }

            settings.general = { ...settings.general, ...general };
        }

        if (fees) {
            settings.fees = { ...settings.fees, ...fees };
        }

        if (landingPage) {
            settings.landingPage = { ...settings.landingPage, ...landingPage };
        }

        if (maintenanceMode !== undefined) {
            settings.mentenanceMode = maintenanceMode;
        }

        await settings.save();

        res.status(200).json({
            success: true,
            message: "Admin settings updated successfully",
            data: settings,
        });
    } catch (error) {
        console.error("Error updating admin settings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update admin settings",
            error: error.message,
        });
    }
};

export const projectDispute = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId } = req.user;
        const { disputeTitle, disputeTopic, priority, description, userType, buyerId, croId } = req.body;

        if (!req.files?.screenShots) {
            return res.status(400).send({ message: "No screenshots uploaded" });
        }
        const screenShotUploads = await Promise.all(
            req.files.screenShots.map(async (file) => {
                const uploadResult = `/public/uploads/${file.filename}`;
                return {
                    name: file.originalname,
                    filePath: uploadResult
                };
            }

            )
        );

        const dispute = new Dispute({
            projectId,
            disputeTitle,
            disputeTopic,
            priority,
            description,
            screenShots: screenShotUploads,
            initiatedBy: {
                userId,
                userType
            },
            buyerId,
            croId,

            buyerId,
            croId,

        });

        const adminids = (await User.find({ role: "admin" }).select("_id")).map(user => user._id.toString());
        adminids.forEach(async (adminid) => {

            notificationServiceInstance.sendUserNotification(adminid, "DISPUTE_CREATED", {
                userId: adminid,
                title: `New Dispute Raised`,
                description: `${process.env.DOMAIN}/admin/disputes`,
            });
        })
        await dispute.save();

        res.status(201).json({
            success: true,
            message: "Dispute created successfully",
            dispute
        });

    } catch (error) {
        console.error("Error creating dispute:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

// export const allDisputes = async (req, res) => {
//     try {

//         const allDisputes = await Dispute.aggregate([
//             {
//                 $lookup: {
//                     from: "projects",
//                     localField: "projectId",
//                     foreignField: "_id",
//                     as: "projectDetails",
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "buyers",
//                     localField: "buyerId",
//                     foreignField: "_id",
//                     as: "buyerDetails",
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "cros",
//                     localField: "croId",
//                     foreignField: "_id",
//                     as: "croDetails",
//                 },
//             },
//             {
//                 $unwind: "$projectDetails",
//             },
//             {
//                 $unwind: {
//                     path: "$buyerDetails",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $unwind: {
//                     path: "$croDetails",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $addFields: {
//                     participants: {
//                         buyer: "$buyerDetails",
//                         cro: "$croDetails",
//                     },
//                 },
//             },
//             {
//                 $project: {
//                     buyerDetails: 0,
//                     croDetails: 0,
//                 },
//             },
//         ]);




//         return res.status(200).send({
//             message: "all disputes retrieve successfully",
//             data: allDisputes
//         })
//     } catch (error) {
//         console.log(error)
//     }
// }


export const allDisputes = async (req, res) => {
    try {
        const allDisputes = await Dispute.aggregate([
            {
                $lookup: {
                    from: "projects",
                    localField: "projectId",
                    foreignField: "_id",
                    as: "projectDetails",
                },
            },
            { $unwind: "$projectDetails" },

            {
                $lookup: {
                    from: "buyers",
                    localField: "buyerId",
                    foreignField: "_id",
                    as: "buyerDetails",
                },
            },
            {
                $lookup: {
                    from: "cros",
                    localField: "croId",
                    foreignField: "_id",
                    as: "croDetails",
                },
            },
            {
                $unwind: {
                    path: "$buyerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: {
                    path: "$croDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "chats",
                    let: {
                        projectIdStr: { $toString: "$projectDetails._id" },
                        buyerIdStr: { $toString: "$buyerId" },
                        adminIdStr: { $toString: "$projectDetails.approvedBy" }
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: [{ $toString: "$projectid" }, "$$projectIdStr"] },
                                        { $eq: [{ $toString: "$sender" }, "$$buyerIdStr"] },
                                        { $eq: [{ $toString: "$receiver" }, "$$adminIdStr"] },
                                        { $eq: ["$seen", false] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "buyerUnseenChats",
                },
            },

            {
                $lookup: {
                    from: "chats",
                    let: {
                        projectIdStr: { $toString: "$projectDetails._id" },
                        croIdStr: { $toString: "$croId" },
                        adminIdStr: { $toString: "$projectDetails.approvedBy" }
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: [{ $toString: "$projectid" }, "$$projectIdStr"] },
                                        { $eq: [{ $toString: "$sender" }, "$$croIdStr"] },
                                        { $eq: [{ $toString: "$receiver" }, "$$adminIdStr"] },
                                        { $eq: ["$seen", false] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "croUnseenChats",
                },
            },



            ////////////////////////////////////

            // Updated: Lookup for unseen chats from admin to buyer
            {
                $lookup: {
                    from: "chats",
                    let: {
                        projectIdStr: { $toString: "$projectDetails._id" },
                        buyerIdStr: { $toString: "$buyerId" },
                        adminIdStr: { $toString: "$projectDetails.approvedBy" }
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: [{ $toString: "$projectid" }, "$$projectIdStr"] },
                                        { $eq: [{ $toString: "$sender" }, "$$adminIdStr"] },
                                        { $eq: [{ $toString: "$receiver" }, "$$buyerIdStr"] },
                                        { $eq: ["$seen", false] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "buyerchat",
                },
            },
            {
                $lookup: {
                    from: "chats",
                    let: {
                        projectIdStr: { $toString: "$projectDetails._id" },
                        croIdStr: { $toString: "$croId" },
                        adminIdStr: { $toString: "$projectDetails.approvedBy" }
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: [{ $toString: "$projectid" }, "$$projectIdStr"] },
                                        { $eq: [{ $toString: "$sender" }, "$$adminIdStr"] },
                                        { $eq: [{ $toString: "$receiver" }, "$$croIdStr"] },
                                        { $eq: ["$seen", false] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: "crochat",
                },
            },

            /////////////////////////////////////////
            {
                $addFields: {
                    participants: {
                        buyer: {
                            $cond: {
                                if: { $gt: [{ $type: "$buyerDetails" }, "missing"] },
                                then: {
                                    $mergeObjects: [
                                        "$buyerDetails",
                                        { unseenChatCount: { $size: "$buyerUnseenChats" } }
                                    ]
                                },
                                else: null
                            }
                        },
                        cro: {
                            $cond: {
                                if: { $gt: [{ $type: "$croDetails" }, "missing"] },
                                then: {
                                    $mergeObjects: [
                                        "$croDetails",
                                        { unseenChatCount: { $size: "$croUnseenChats" } }
                                    ]
                                },
                                else: null
                            }
                        },
                    },
                    buyer: {
                        $cond: {
                            if: { $gt: [{ $type: "$buyerDetails" }, "missing"] },
                            then: {
                                $mergeObjects: [
                                    "$buyerDetails",
                                    { unseenChatCount: { $size: "$buyerchat" } }
                                ]
                            },
                            else: null
                        }
                    },
                    cro: {
                        $cond: {
                            if: { $gt: [{ $type: "$croDetails" }, "missing"] },
                            then: {
                                $mergeObjects: [
                                    "$croDetails",
                                    { unseenChatCount: { $size: "$crochat" } }
                                ]
                            },
                            else: null
                        }
                    },
                }
            },
            {
                $project: {
                    buyerDetails: 0,
                    croDetails: 0,
                    buyerUnseenChats: 0,
                    croUnseenChats: 0,
                    buyerchat: 0,
                    crochat: 0

                }
            }
        ]);
        console.log(allDisputes)
        return res.status(200).send({
            message: "All disputes retrieved successfully",
            data: allDisputes
        });
    } catch (error) {
        console.error("Dispute Fetch Error:", error);
        return res.status(500).send({ message: "Something went wrong" });
    }
};

export const updateUnseenChatCount = async (req, res) => {
    try {
        const { projectId, senderId } = req.params;

        console.log("Query:", {
            projectid: projectId,
            sender: senderId,

        });

        const result = await chats.updateMany(
            {
                projectid: projectId,
                sender: senderId,
                seen: false,
            },
            {
                $set: { seen: true },
            }
        );

        console.log("Update Result:", result);

        res.json({
            status: true,
            message: "Messages marked as seen successfully",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error marking messages as seen:", error);
        res.status(500).json({ error: error.message });
    }
};
export const updateUnseenCroChatCount = async (req, res) => {
    try {
        const { projectId, croId } = req.params;

        console.log("Query:", {
            projectid: projectId,
            receiver: croId,

        });

        const result = await chats.updateMany(
            {
                projectid: projectId,
                receiver: croId,
                seen: false,
            },
            {
                $set: { seen: true },
            }
        );

        console.log("Update Result:", result);

        res.json({
            status: true,
            message: "Messages marked as seen successfully",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Error marking messages as seen:", error);
        res.status(500).json({ error: error.message });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const dispute = await Dispute.findById({ _id: id });
        if (!dispute) {
            return res.status(404).json({ error: "Dispute not found" });
        }

        const validStatus = ["Open", "Under Review", "MarkAsDone", "closed"];
        if (!validStatus.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        dispute.status = status;

        const bId = await buyer.findOne({ _id: dispute.buyerId }).select("_id name email")
        const cId = await cro.findOne({ _id: dispute.croId }).select("_id name email")
        const croId = cId?._id.toString();
        const onlyId = bId?._id.toString();
        const tempuser = [bId, cId]

        onlyId.forEach(async (id) => {
            notificationServiceInstance.sendUserNotification(id, "DISPUTE_STATUS_UPDATED", {
                userId: id,
                title: `Dispute Status Updated`,
                description: `${process.env.DOMAIN}/buyer/messages`,
            });
        })

        croId.forEach(async (id) => {
            notificationServiceInstance.sendUserNotification(id, "DISPUTE_STATUS_UPDATED", {
                userId: id,
                title: `Dispute Status Updated`,
                description: `${process.env.DOMAIN}/cro/messages`,
            });
        })

        tempuser.forEach(async (user) => {
            const mailTemplete = NotificationTemplate(user.name, "Dispute Status Update", `Dispute Status Updated - ${dispute.status}`, "https://oncload.com", "BioBridge")
            const mailOptions = {
                email: user.email,
                subject: "Dispute Status Update",
                html: mailTemplete,
            };
            sendEmail(mailOptions)
        })
        await dispute.save();
        res.json({
            success: true,
            message: "Status updated successfully",
            newStatus: status
        });

    } catch (error) {
        console.error("Status update error:", error);
        res.status(500).json({ error: "Server error during status update" });
    }
};

//create admin
export const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        const existUser = await User.findOne({ email: email });
        if (existUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const avatarUrl = getAvatarUrl(name);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            profileImage: avatarUrl,
            status: 1,
            role: "admin",
            isVerified: true,
        });

        const token = jwt.sign({ userId: user._id, type: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });


        await user.save();

        res.status(201).json({
            success: true,
            message: "Admin created successfully",
            token,
            data: user
        });
    } catch (error) {
        console.error("Error creating admin:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// revoke or grant access admin
export const revokeGrantAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        let user = await User.findById(id);

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

//get all admin list
export const getAllAdmin = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const admins = await User.find().skip((page - 1) * limit)
            .limit(parseInt(limit)).sort({ createdAt: -1 });
        const totalAdmins = await User.countDocuments();
        const totalPages = Math.ceil(totalAdmins / limit);
        res.json({
            status: true, admins, pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalAdmins,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//delete admin by id
export const deleteAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const adminToDelete = await User.findByIdAndDelete(id);

        if (!adminToDelete) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error("Error deleting admin:", error);
        res.status(500).json({ error: error.message });
    }
};

//search admin by name
export const searchAdminByName = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;
        const admins = await User.find({
            name: { $regex: q, $options: "i" }
        })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const totalAdmins = await User.countDocuments({
            name: { $regex: q, $options: "i" }
        });
        const totalPages = Math.ceil(totalAdmins / limit);
        res.status(200).json({
            success: true,
            admins,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalAdmins,
                limit: parseInt(limit),
            },
        });

    } catch (error) {
        console.error("Error searching admin by name:", error);
        res.status(500).json({ error: error.message });
    }
};

export const filterDisputesByProjectNameStatus = async (req, res) => {
    const { q, status, page = 1, limit = 10 } = req.query;
    try {
        const disputes = await Dispute.aggregate([
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
                    localField: "buyerId",
                    foreignField: "_id",
                    as: "buyerDetails",
                },
            },
            {
                $lookup: {
                    from: "cros",
                    localField: "croId",
                    foreignField: "_id",
                    as: "croDetails",
                },
            },
            {
                $unwind: "$projectDetails",
            },
            {
                $unwind: {
                    path: "$buyerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: {
                    path: "$croDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    participants: {
                        buyer: "$buyerDetails",
                        cro: "$croDetails",
                    },
                },
            },
            {
                $match: {
                    $and: [
                        {
                            $or: [{ "projectDetails.title": { $regex: q, $options: "i" } }],
                        },
                        ...(status ? [{ status: status }] : []),
                    ],
                },
            },
            {
                $project: {
                    buyerDetails: 0,
                    croDetails: 0,
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
        ]);
        res.status(200).json({
            success: true,
            data: disputes,
        });

    } catch (error) {
        console.error("Error filtering disputes:", error);
        res.status(500).json({ error: error.message });
    }

}
// contact us
export const submitContactUsForm = async (req, res) => {
    try {
        const { firstName, lastName, email, subject, message } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Create a new contact entry
        const newContact = new ContactUs({
            firstName,
            lastName,
            email,
            subject,
            message,
        });

        // Save to the database
        await newContact.save();

        // Respond with success
        res.status(201).json({ message: 'Your message has been submitted successfully.' });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ error: 'An error occurred while submitting the form. Please try again later.' });
    }
};

// appointmentBooking
export const appointmentBooking = async (req, res) => {
    try {
        const { firstName, lastName, email, contactNumber, message } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !contactNumber || !message) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Create a new appointment entry
        const appointment = new AppointmentBooking({
            firstName,
            lastName,
            email,
            contactNumber,
            message,
        });

        // Save to the database
        await appointment.save();

        // Respond with success
        res.status(201).json({ message: 'Your Appointment has been booked successfully.' });
    } catch (error) {
        console.error('Error submitting appointment form:', error);
        res.status(500).json({ error: 'An error occurred while submitting the form. Please try again later.' });
    }
};