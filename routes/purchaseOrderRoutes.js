import express from 'express';
import {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    getPurchaseOrdersByStatus,
    updatePurchaseOrderAttachment, searchPurchaseOrders,
    getPurchaseOrdersByProject, getPurchaseOrdersByBuyerId, getPurchaseOrdersByCroId,
    
} from '../controllers/purchaseOrderController.js';
import authMiddleware from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';


const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create a new purchase order
router.post('/create-purchase-order/:quoteId', upload.single('file'), createPurchaseOrder);

// Get all purchase orders
router.get('/get-all-purchase-orders', getAllPurchaseOrders);

// Get a purchase order by ID
router.get('/get-purchase-order/:id', getPurchaseOrderById);

// Update a purchase order
router.patch('/update-purchase-order/:id', updatePurchaseOrder);

// Get purchase orders by status
router.get('/get-purchase-orders-by-status/search/query', getPurchaseOrdersByStatus);

// Add attachments to a purchase order
router.post('/add-attachments/:id', upload.single('file'), updatePurchaseOrderAttachment);

// Get purchase orders by project ID
router.get('/get-purchase-orders-by-project/:projectId', getPurchaseOrdersByProject);

// Search purchase orders by buyer name or project name
router.get('/search-purchase-orders', searchPurchaseOrders);

// Get purchase orders by buyer ID
router.get('/buyer/get-purchase-orders-by-buyer', getPurchaseOrdersByBuyerId);

// Get purchase orders by CRO ID
router.get('/cro/get-purchase-orders-by-cro', getPurchaseOrdersByCroId);

export default router;