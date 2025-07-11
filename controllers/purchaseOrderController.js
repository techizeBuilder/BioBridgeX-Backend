import PurchaseOrder from '../models/purchaseOrder.js';
import fs from 'fs/promises';
import Quote from '../models/quotes.js';
import buyer from '../models/buyer.js';
import Project from '../models/project.js';
import User from '../models/admin.js';
import { notificationServiceInstance } from '../utils/socketserver.js';


// Create a new purchase order
export const createPurchaseOrder = async (req, res) => {
    try {
        const quoteId = req.params.quoteId;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const quote = await Quote.findById({ _id: quoteId });
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        const [projectData, buyerData] = await Promise.all([
            Project.findById(quote.projectId),
            buyer.findById(quote.buyerId),
        ]);

        if (!projectData || !buyerData) {
            return res.status(404).json({ error: 'Project or Buyer data not found' });
        }

        const poExists = await PurchaseOrder.findOne({ projectId: projectData._id, croId: quote.croId, buyerId: quote.buyerId });

        if (poExists) {
            return res.status(404).json({ error: "Purchase Order already exist with this quote." });
        }

        const fileUrl = `/public/uploads/${req.file.filename}`;

        const purchaseOrder = new PurchaseOrder({
            projectId: quote.projectId,
            buyerId: quote.buyerId,
            croId: quote.croId,
            quoteId: quoteId,
            projectName: projectData.title,
            projectPostDate: projectData.createdAt,
            purchaseOrderUploadDate: new Date(),
            buyerName: buyerData.name,
            attatchement: fileUrl,
            status: 'Pending',
            rejectReason: null,
            reviseReason: null,
        });

        await purchaseOrder.save();
        const adminids = (await User.find({ role: "admin" }).select("_id")).map(user => user._id.toString());

        adminids.forEach(async (adminid) => {

            notificationServiceInstance.sendUserNotification(adminid, "PURCHASE_ORDER_BY_BUYER", {
                userId: adminid,
                title: "Purchase Order Uploaded",
                description: `${process.env.DOMAIN}/admin/buyer-po`,
            });
        })

        res.json({
            status: true, purchaseOrder,
        });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all purchase orders
export const getAllPurchaseOrders = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const purchaseOrders = await PurchaseOrder.find().skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const totalPurchaseOrder = await PurchaseOrder.countDocuments();
        const totalPages = Math.ceil(totalPurchaseOrder / limit);
        res.json({
            status: true, purchaseOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalPurchaseOrder,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a purchase order by ID
export const getPurchaseOrderById = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findById(req.params.id);
        if (!purchaseOrder) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        res.json(purchaseOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Update a purchase order
export const updatePurchaseOrder = async (req, res) => {
    try {
        const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        if (!purchaseOrder) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        res.json({
            message: "Purchase order updated successfully",
            purchaseOrder
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get purchase orders by status
export const getPurchaseOrdersByStatus = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const { status } = req.query;
        const purchaseOrders = await PurchaseOrder.find({ status: status }).skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const totalPurchaseOrder = await PurchaseOrder.countDocuments({ status: status });
        const totalPages = Math.ceil(totalPurchaseOrder / limit);
        res.json({
            status: true, purchaseOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalPurchaseOrder,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update attachments to a purchase order
export const updatePurchaseOrderAttachment = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const purchaseOrder = await PurchaseOrder.findById(req.params.id);
        if (!purchaseOrder) {
            await fs.unlink(req.file.path);
            return res.status(404).json({ error: 'PurchaseOrder not found' });
        }

        const fileUrl = `/public/uploads/${req.file.filename}`;
        purchaseOrder.attatchement = fileUrl;
        purchaseOrder.updatedAt = new Date();
        purchaseOrder.status = "Pending"
        await purchaseOrder.save();
        const adminids = (await User.find({ role: "admin" }).select("_id")).map(user => user._id.toString());

        adminids.forEach(async (adminid) => {

            notificationServiceInstance.sendUserNotification(adminid, "PURCHASE_ORDER_UPDATE", {
                userId: adminid,
                title: "Purchase Order Updated",
                description: `${process.env.DOMAIN}/admin/buyer-po`,
            });
        })

        res.json({
            success: true,
            message: 'Attachment uploaded successfully',
            data: purchaseOrder
        });
    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
};

// Get purchase orders by project ID
export const getPurchaseOrdersByProject = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const purchaseOrders = await PurchaseOrder.findOne({ projectId: req.params.projectId }).populate({
            path: "croId",
            model: "cro",
        }).skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const totalPurchaseOrder = await PurchaseOrder.countDocuments({ projectId: req.params.projectId });
        const totalPages = Math.ceil(totalPurchaseOrder / limit);
        res.json({
            status: true, purchaseOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalPurchaseOrder,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// search purchase orders by buyer name or project name
export const searchPurchaseOrders = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const { q } = req.query;
        const purchaseOrders = await PurchaseOrder.find({
            $or: [
                { buyerName: { $regex: q, $options: 'i' } },
                { projectName: { $regex: q, $options: 'i' } }
            ]
        }).skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const totalPurchaseOrder = await PurchaseOrder.countDocuments({
            $or: [
                { buyerName: { $regex: q, $options: 'i' } },
                { projectName: { $regex: q, $options: 'i' } }
            ]
        });
        const totalPages = Math.ceil(totalPurchaseOrder / limit);
        res.json({
            status: true, purchaseOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalPurchaseOrder,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//get purchase orders by buyerId
export const getPurchaseOrdersByBuyerId = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;
    try {
        const purchaseOrders = await PurchaseOrder.find({ buyerId: userId }).populate({
            path: "croId",
            model: "cro",
        }).populate({
            path: "projectId",
            model: "Project"
        }).populate({
            path: "quoteId",
            model: "Quote"
        })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const totalPurchaseOrder = await PurchaseOrder.countDocuments({ buyerId: userId });
        const totalPages = Math.ceil(totalPurchaseOrder / limit);
        res.json({
            status: true, purchaseOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalPurchaseOrder,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//get purchase orders by croId
export const getPurchaseOrdersByCroId = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.userId;

    try {
        const purchaseOrders = await PurchaseOrder.find({ croId: userId }).populate({
            path: "croId",
            model: "cro",
        }).populate({
            path: "projectId",
            model: "Project"
        }).populate({
            path: "quoteId",
            model: "Quote"
        })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const totalPurchaseOrder = await PurchaseOrder.countDocuments({ croId: userId });
        const totalPages = Math.ceil(totalPurchaseOrder / limit);
        res.json({
            status: true, purchaseOrders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalPurchaseOrder,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};