import express from 'express';
import {
    createQuote,
    getAllQuotes,
    getQuoteById,
    updateQuote, getAllQuoteByBuyerAndProjectId, markMilestoneAsDone, updateQuoteBuyerStatus, searchQuoteByProjectNameOrCro, getQuoteByProjectCroBuyer,
    getAllQuoteByCroAndProjectId,
    getQuoteByProjectId,
} from '../controllers/quoteController.js';
import authMiddleware from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create a new quote
router.post('/create-quote/:projectId', upload.fields(
    [{ name: 'attachments', maxCount: 1 }]
), createQuote);

// Get all quotes
router.get('/get-all-quotes', getAllQuotes);

// Get all quotes by buyer and project ID
router.get('/quotes/get-all-quotes', getAllQuoteByBuyerAndProjectId);
router.get('/quotes/cro/get-all-quotes', getAllQuoteByCroAndProjectId);

router.get("/getAllQuotes/single-project/:projectId", getQuoteByProjectId)
// Get a single quote by ID
router.get('/single-quotes/details', getQuoteById);

// Update a quote
router.post('/update-quote/:id', upload.fields([{ name: 'attachments', maxCount: 1 }]), updateQuote);

//mark milestone as done
router.post('/mark-milestone-as-done/:id', markMilestoneAsDone);

//update quote buyer status
router.post('/buyer-status-update/:id', updateQuoteBuyerStatus);

router.get('/search/search-quote', searchQuoteByProjectNameOrCro);

router.get('/quote-details/:projectId/:croId/:buyerId', getQuoteByProjectCroBuyer);

export default router;