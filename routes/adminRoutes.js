import express from 'express';
import {
    getAllProjects,
    getProjectById,
} from '../controllers/projectController.js';
import authMiddleware from '../middleware/auth.js';
import { assignProjectToCROs, getAllCros, getAllBuyer, updateProjectStatus, toggleAdminVerification, searchBuyerByName, searchCroByName, getAdminDashboardAnalytics, updateAdminSettings, getAdminSettings, getAdminDashboardStats, getRevenueTrendsAndCategories, getTopBuyersAndCROs, getProjectTrendsAndUserActivity, getCommissionEarnings, projectDispute, allDisputes, updateStatus, revokeGrantAccess, deleteAdmin, getAllAdmin, createAdmin, searchAdminByName, filterDisputesByProjectNameStatus, submitContactUsForm, appointmentBooking, getLandingPageHeading, updateUnseenChatCount, updateUnseenCroChatCount } from '../controllers/adminControllers.js';
import { getAllOrganizationProfiles } from '../controllers/organizationProfileController.js';
import { getAllQuotes } from '../controllers/quoteController.js';
import { upload } from '../middleware/multer.js';
import ContactUs from '../models/contactUs.js';

const router = express.Router();
router.post("/landing-page/contact-us", submitContactUsForm);
router.post("/landing-page/appointment-booking", appointmentBooking);
router.get("/landing-page/heading", getLandingPageHeading);

router.use(authMiddleware);

// Get all projects
router.get('/all-projects', getAllProjects);
router.get('/:id', getProjectById);
router.patch('/assign/:projectId', assignProjectToCROs);
router.get("/cros/getallcros", getAllCros);
router.get("/buyer/getallbuyer", getAllBuyer);
router.get("/projects/:id", getProjectById);
router.get("/profile/all-profile-organization", getAllOrganizationProfiles);
router.post("/project/update-status/:id", updateProjectStatus);
router.get("/quotes/get-cro-quotes", getAllQuotes);
router.get('/buyer/search-buyer', searchBuyerByName);
router.get('/cro/search-cro', searchCroByName);
router.get('/dashboard/dashboard-analytics', getAdminDashboardAnalytics);
router.post('/verify/:id', toggleAdminVerification);
router.get('/site-settings/admin-settings', getAdminSettings);
router.patch('/site-settings/admin-settings', upload.single('siteLogo'), updateAdminSettings);
router.get('/dashboard/dashboard-stats', getAdminDashboardStats);
router.get('/dashboard/revenue-trends-and-categories', getRevenueTrendsAndCategories);
router.get('/dashboard/top-buyers-and-cros', getTopBuyersAndCROs);
router.get('/dashboard/project-trends-and-user-activity', getProjectTrendsAndUserActivity);
router.get('/dashboard/commission-earnings', getCommissionEarnings);
router.patch('/allchat/:projectId/mark-seen/:senderId', updateUnseenChatCount);
router.patch('/all-chat/:projectId/mark-seen/:croId', updateUnseenCroChatCount);
router.post('/cro/projects/:projectId/disputes', upload.fields([{ name: 'screenShots', maxCount: 5 }]), projectDispute);
router.post('/buyer/projects/:projectId/disputes', upload.fields([{ name: 'screenShots', maxCount: 5 }]), projectDispute);
router.get("/dispute/get-all-disputes", allDisputes);
router.patch("/dispute/status/:id", updateStatus);
router.post("/admin/create", createAdmin);
router.patch("/user/revoke-grant-access/:id", revokeGrantAccess);
router.delete("/admin/delete/:id", deleteAdmin);
router.get("/admin/get-all-admin", getAllAdmin);
router.get("/search/admin-by-name", searchAdminByName);
router.get("/search/dispute-by-project-name-status", filterDisputesByProjectNameStatus);


export default router; 