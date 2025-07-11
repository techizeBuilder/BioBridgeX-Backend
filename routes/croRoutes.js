import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getAllCroAssingProject, getCRODashboardAnalytics, getCROAnalytics, getCroProfile, updateCroProfile } from '../controllers/croControllers.js';
import { getProjectById } from '../controllers/projectController.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/allcroassign-project', getAllCroAssingProject);
router.get("/single-project-detail/:id", getProjectById);
router.get('/dashboard-analytics', getCRODashboardAnalytics);
router.get('/page/cro-analytics', getCROAnalytics);
router.get('/settings/profile', getCroProfile);
router.patch('/profile/update', updateCroProfile);
export default router;