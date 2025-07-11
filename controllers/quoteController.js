import Project from '../models/project.js';
import Quote from '../models/quotes.js';
import Payment from '../models/payment.js';
import PurchaseOrder from '../models/purchaseOrder.js';
import buyer from '../models/buyer.js';
import cro from '../models/cro.js';
import { notificationServiceInstance } from '../utils/socketserver.js';
import User from '../models/admin.js';
import sendEmail from '../utils/email.js';
import { NotificationTemplate } from '../utils/EmailTemplates/notificationtemp.js';
import quoteAccepted from '../utils/EmailTemplates/quoteAccepted.js';
import quoteDeclined from '../utils/EmailTemplates/quoteDeclined.js';
import quoteRevised from '../utils/EmailTemplates/quoteRevised.js';

export const createQuote = async (req, res) => {
    try {
        const { files } = req;
        const { userId } = req.user;
        const { milestoneList } = req.body;
        const { projectId } = req.params;
        console.log(files)
        const projectDetails = await Project.findById(projectId);

        let mile;
        if (!milestoneList) {
            mile = [];
        } else {
            mile = JSON.parse(milestoneList);
        }

        let attachmentFile = null;
        console.log("2")
        if (files?.attachments?.length > 0) {
            console.log("3")
            const attachment = files.attachments[0].filename;
            attachmentFile = `/public/uploads/${attachment}`;
        }
        console.log('4')
        const quote = new Quote({
            ...req.body,
            attachments: attachmentFile,
            milestoneList: mile,
            croId: userId,
            projectId: projectId,
            buyerId: projectDetails.buyerId
        });


        await quote.save();


        const project = await Project.findOneAndUpdate({ _id: projectId }, {
            milestones: mile,
        }, { new: true });


        const bId = await buyer.findOne({ _id: quote.buyerId }).select("_id name email")
        const cId = await cro.findOne({ _id: userId })

        const onlyId = bId?._id.toString();
        
        notificationServiceInstance.sendUserNotification(onlyId, "QUOTES_CREATED", {
            userId: quote._id,
            title: `New Quote Received from ${cId.organizationName}`,
            description: `${process.env.DOMAIN}/buyer/quote-details?quoteId=${quote._id}`,
        });

        const mailTemplete = NotificationTemplate(bId.name, "New Quote Created", `New Quote Created from- ${bId.name}`, "https://oncload.com", "BioBridge")
        const mailOptions = {
            email: bId.email,
            subject: "New Quote Created",
            html: mailTemplete,
        };
        sendEmail(mailOptions)

        res.status(201).json({
            message: "Quote created and project milestone updated successfully",
            quote,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getAllQuotes = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const quotes = await Quote.find()
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate({
                path: 'projectId',
                select: 'title projectStartDate buyerId description budgetRange endpointsOfInterest projectCode',
                model: 'Project',
                populate: {
                    path: 'buyerId',
                    select: 'name',
                    model: 'buyer'
                }
            })
            .populate({
                path: 'croId',
                select: 'name',
                model: 'cro',
            }).sort({ createdAt: -1 });

        const totalQuotes = await Quote.countDocuments();
        const totalPages = Math.ceil(totalQuotes / limit);

        res.json({
            success: true,
            data: quotes,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalQuotes,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllQuoteByBuyerAndProjectId = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user;
        // const { projectId } = req.params;

        const quotes = await Quote.find({ buyerId: userId.userId })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate({
                path: 'projectId',
                model: 'Project',
            })
            .populate({
                path: 'croId',
                select: 'name businessAddress',
                model: 'cro',
            }).populate({
                path: 'buyerId',
                select: 'name',
                model: 'buyer',
            })
            .sort({ createdAt: -1 });

        const totalQuotes = await Quote.countDocuments({ buyerId: userId.userId });
        const totalPages = Math.ceil(totalQuotes / limit);

        res.status(200).json({
            success: true,
            data: quotes,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalQuotes,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const getQuoteByProjectId = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user;
        const { projectId } = req.params;

        const quotes = await Quote.find({ buyerId: userId.userId, projectId: projectId })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate({
                path: 'projectId',
                model: 'Project',
            })
            .populate({
                path: 'croId',
                select: 'name businessAddress',
                model: 'cro',
            }).populate({
                path: 'buyerId',
                select: 'name',
                model: 'buyer',
            })
            .sort({ createdAt: -1 });

        const totalQuotes = await Quote.countDocuments({ buyerId: userId.userId });
        const totalPages = Math.ceil(totalQuotes / limit);

        res.status(200).json({
            success: true,
            data: quotes,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalQuotes,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllQuoteByCroAndProjectId = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user;

        const quotes = await Quote.find({ croId: userId.userId })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate({
                path: 'projectId',
                select: 'title description',
                model: 'Project',
            })
            .populate({
                path: 'croId',
                select: 'name',
                model: 'cro',
            }).populate({
                path: 'buyerId',
                select: 'name',
                model: 'buyer',
            })
            .sort({ createdAt: -1 });

        const totalQuotes = await Quote.countDocuments({ buyerId: userId.userId });
        const totalPages = Math.ceil(totalQuotes / limit);

        res.status(200).json({
            success: true,
            data: quotes,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalQuotes,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getQuoteById = async (req, res) => {
    try {
        const { quoteId } = req.query
        const quote = await Quote.findById({ _id: quoteId }).populate({
            path: "croId",
            select: "name email address",
            model: "cro",
        }).populate({
            path: "projectId",
            select: "title description projectCode",
            model: "Project",
        }).populate({
            path: "buyerId",
            select: "name address",
            model: "buyer",
        })
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateQuote = async (req, res) => {
    try {
        const { id } = req.params;
        const { files } = req;
        const { milestoneList } = req.body;
        console.log(req.body)
        const updateData = req.body;
        let mile;
        if (!milestoneList) {
            mile = [];
        } else {
            mile = JSON.parse(req.body.milestoneList);
        }


        let attachmentsUploads;
        if (files.attachments) {
            const masterServiceAgreementFile = files.attachments[0].filename;
            const attachmentsUp = `/public/uploads/${masterServiceAgreementFile}`;
            attachmentsUploads = attachmentsUp;
        }

        const quote = await Quote.findOneAndUpdate(
            { _id: id },
            {
                ...updateData,
                buyerStatus: 'Pending',
                milestoneList: mile,
                attachments: attachmentsUploads
            },
            { new: true, }
        );

        const bId = await buyer.findOne({ _id: quote.buyerId }).select("_id name email")
        const onlyId = bId?._id.toString();
        notificationServiceInstance.sendUserNotification(onlyId, "QUOTE_UPDATED", {
            userId: quote._id,
            title: `Quote Updated.`,
            description: `${process.env.DOMAIN}/buyer/quote-details?quoteId=${quote._id}`,
        });

        const mailTemplete = NotificationTemplate(bId.name, "Quote Updated", `Quote Updated from- ${bId.name}`, "https://oncload.com", "BioBridge")
        const mailOptions = {
            email: bId.email,
            subject: "Quote Updated.",
            html: mailTemplete,
        };
        sendEmail(mailOptions)
        res.json(quote);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const updateQuoteBuyerStatus = async (req, res) => {
    const { buyerStatus, reason, croId } = req.body;
    const { id } = req.params;
    console.log("nidhi", croId)
    try {
        if ((buyerStatus === 'Revised' || buyerStatus === 'Rejected') && !reason) {
            return res.status(400).json({ error: 'Reason is required for this status' });
        }
        let update = { buyerStatus };
        if (buyerStatus === 'Revised') {
            update.reviseReason = reason;
        } else if (buyerStatus === 'Rejected') {
            update.rejectReason = reason;
        }

        const quote = await Quote.findByIdAndUpdate(id, update, { new: true });
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        const cId = await cro.findOne({ _id: croId }).select("_id name email")
        const onlyId = cId?._id.toString();
        const buyerData = await buyer.findById(quote.buyerId)
        const project = await Project.findById(quote.projectId)
        const link = `${process.env.DOMAIN}/cro/quotesdetails/quoteId=${quote._id}`;

        notificationServiceInstance.sendUserNotification(onlyId, "QUOTES_STATUS_BY_BUYER", {
            userId: quote._id,
            title: `Your Quote ${update.buyerStatus} by ${cId.name}`,
            description: `${process.env.DOMAIN}/cro/quotesdetails/quoteId=${quote._id}`,

        });

        if (update.buyerStatus == "Approved") {
            sendEmail({
                email: cId.email,
                subject: `Quote Accepted – Project  ${project._id} Moving Forward`,
                html: quoteAccepted(cId.name, buyerData, project, link),
            });
        }
        else if (update.buyerStatus == "Rejected") {
            sendEmail({
                email: cId.email,
                subject: `Quote Declined for Project - ${project._id}`,
                html: quoteDeclined(quote, bId.name, buyerData, project, link),
            });
        }
        else if (update.buyerStatus == "Revised") {
            sendEmail({
                email: cId.email,
                subject: `Quote ReVised for Project - ${project._id}`,
                html: quoteRevised(quote, cId.name, buyerData, project),
            });
        }
        return res.json({
            status: true,
            message: 'Quote updated successfully',
            quote
        });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const markMilestoneAsDone = async (req, res) => {
    try {
        console.log(req.body)
        const { milestoneId } = req.body;
        console.log(milestoneId)
        const quote = await Quote.findById(req.params.id);
        console.log("quote",quote)
        const project = await Project.findById(quote.projectId);
        const po = await PurchaseOrder.findOne({ projectId: project._id, croId: quote.croId, buyerId: quote.buyerId });
        
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        if (!po) {
            return res.status(404).json({ error: "Unable to create payment.\n No PO association found with this quote." });
        }

        const milestone = quote.milestoneList.find(m => m._id.toString() === milestoneId);
        if (!milestone) {
            return res.status(404).json({ error: 'Milestone not found' });
        }

        milestone.status = 'Done';
        await quote.save();
        const payment = new Payment({
            amount: milestone.mileStoneBudget,
            Totalamount: quote.baseStudyCost,
            orderId: null,
            payeeId: project.buyerId,
            projectId: quote.projectId,
            payTo: quote.croId,
            po: po._id,
            status: 'Pending',
            paymentStatus: 'Pending',
            milestone: milestone,
            attatchement: null,
            percentage: quote.milestoneList.filter(m => m.status === 'Done').length / quote.milestoneList.length * 100,
        });
        await payment.save();
        const admin = (await User.find({ role: "admin" }).select("_id name email"))
        const adminids = admin.map(user => user._id.toString());
        const bId = await buyer.findOne({ _id: quote.buyerId }).select("_id name email")
        const onlyId = bId?._id.toString();

        adminids.forEach(async (adminid) => {
            notificationServiceInstance.sendUserNotification(adminid, "MILESTONE_DONE", {
                userId: payment._id,
                title: `Milestone Done - ${payment.milestone.milestoneName}`,
                description: `${process.env.DOMAIN}/admin/cro-quotes/${quote._id}`,
            });
        })
        notificationServiceInstance.sendUserNotification(onlyId, "MILESTONE_DONE", {
            userId: payment._id,
            title: `Milestone Done - ${payment.milestone.milestoneName}`,
            description: `${process.env.DOMAIN}/buyer/quote-details?quoteId=${quote._id}`,
        });
        admin.forEach(async (admin) => {
            const mailTemplete = NotificationTemplate(admin.name, "Milestone Status Updated", `Milestone Done - ${payment.milestone}`, "https://oncload.com", "BioBridge")
            const mailOptions = {
                email: admin.email,
                subject: "Milestone Status Updated",
                html: mailTemplete,
            };
            sendEmail(mailOptions)
        })
        const mailTemplete = NotificationTemplate(bId.name, "Milestone Status Updated", `Milestone Done - ${payment.milestone}`, "https://oncload.com", "BioBridge")
        const mailOptions = {
            email: bId.email,
            subject: "Milestone Status Updated",
            html: mailTemplete,
        };
        sendEmail(mailOptions)
        res.status(200).json({
            success: true,
            message: 'Milestone marked as done',
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const searchQuoteByProjectNameOrCro = async (req, res) => {
    try {

        const { q, page = 1, limit = 10 } = req.query;

        const quotes = await Quote.aggregate([
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
                    from: "cros",
                    localField: "croId",
                    foreignField: "_id",
                    as: "croDetails",
                },
            },
            {
                $match: {
                    $or: [
                        { "projectDetails.title": { $regex: q, $options: "i" } },
                        { "croDetails.name": { $regex: q, $options: "i" } },
                    ],
                },
            },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
        ]);

        const totalQuotes = await Quote.aggregate([
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
                    from: "cros",
                    localField: "croId",
                    foreignField: "_id",
                    as: "croDetails",
                },
            },
            {
                $match: {
                    $or: [
                        { "projectDetails.title": { $regex: q, $options: "i" } },
                        { "croDetails.name": { $regex: q, $options: "i" } },
                    ],
                },
            },
            { $count: "total" },
        ]);

        const total = totalQuotes[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            success: true, data: quotes, pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalQuotes: total,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });

    }
};

// Get Quote by projectId, croId, and buyerId
export const getQuoteByProjectCroBuyer = async (req, res) => {
    try {
        const { projectId, croId, buyerId } = req.params;

        if (!projectId || !croId || !buyerId) {
            return res.status(400).json({ message: "Missing required parameters: projectId, croId, or buyerId." });
        }

        const quote = await Quote.findOne({
            projectId,
            croId,
            buyerId
        }).populate({
            path: "croId",
            select: "name email address",
            model: "cro",
        }).populate({
            path: "projectId",
            select: "title description",
            model: "Project",
        }).populate({
            path: "buyerId",
            select: "name address",
            model: "buyer",
        })

        if (!quote) {
            return res.status(404).json({ message: "Quote not found." });
        }

        return res.status(200).json({
            status: true,
            quote
        });
    } catch (error) {
        console.error("Error fetching quote:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};