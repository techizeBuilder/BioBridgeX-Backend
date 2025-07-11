import express from 'express';
import {
    getPaymentsByBuyerId,
    getPaymentsByCroId,
    uploadAttachment,
    updateAttachment, getBuyerPaymentAnalytics, getCroPaymentAnalytics,
    updatePaymentStatus, getAdminPaymentAnalytics,
    updatePaymentProcessingStatus, getAllPayments, searchPayments, updateCroConfirmationStatus, createPayment
} from '../controllers/paymentController.js';
import authMiddleware from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';


const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get payments by buyer ID
router.get('/buyer/payments', getPaymentsByBuyerId);

//get buyer payment analytics
router.get('/buyer/payment-analytics', getBuyerPaymentAnalytics);

//get cro payment analytics
router.get('/cro/payment-analytics', getCroPaymentAnalytics);

// Get admin payment analytics
router.get('/admin/payment-analytics', getAdminPaymentAnalytics);

// Get payments by CRO ID
router.get('/cro/get-payment-by-croId', getPaymentsByCroId);

// Get all payments
router.get('/admin/get-all-payments', getAllPayments);

// Upload attachment
router.post('/:paymentId/upload-attachment', upload.single('file'), uploadAttachment);

// Update attachment
router.put('/:paymentId/update-attachment', upload.single('file'), updateAttachment);

// Update payment status
router.patch('/update-status/:id', updatePaymentStatus);

// Update payment processing status
router.patch('/update-payment-status/:id', updatePaymentProcessingStatus);

// to update cro confirmation status
router.put('/update-cro-confirmation-status/:id', updateCroConfirmationStatus);

// Search payments
router.get('/admin/search', searchPayments);

// Create a new payment
router.post('/cro/create-payment/:id', createPayment);

export default router;