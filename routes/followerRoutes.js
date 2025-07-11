import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { addFollower, getAllBuyerFollowers, getAllCroFollowers, deleteBuyerFollower, deleteCroFollower, updateBuyerFollowerStatus, updateCroFollowerStatus } from '../controllers/authController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/add-follower', addFollower);

router.get('/cro/all-cro-followers', getAllCroFollowers);

router.get('/buyer/all-buyer-followers', getAllBuyerFollowers);

router.delete('/cro/delete-cro-follower/:id', deleteCroFollower);

router.delete('/buyer/delete-buyer-follower/:id', deleteBuyerFollower);

router.patch('/buyer/update-buyer-follower-status/:id', updateBuyerFollowerStatus);

router.patch('/cro/update-cro-follower-status/:id', updateCroFollowerStatus);

export default router;
