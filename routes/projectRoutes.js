import express from 'express';
import {
    createProject,
    getAllProjects,
    getProjectById,
    getProjectsByBuyerId,
    updateProject,
    filterProjectsByStatus,
    searchProjects,
    removeImage,
    getAllSingleChat,
    getAllChat,
    getAllNotification,
    seenNotification,
    markMessagesAsSeen,
} from '../controllers/projectController.js';
import authMiddleware from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create a new project
router.post('/create-project', upload.fields(
    [{ name: 'attachments', maxCount: 5 }]
), createProject);

// Get all projects
router.get('/all-projects', getAllProjects);

// Get a single project by ID
router.get('/single/project-details/:id', getProjectById);
router.patch('/allchat/:projectId/mark-seen/:croId', markMessagesAsSeen);
// Get projects by buyer ID
router.get('/single-buyer/all-projects', getProjectsByBuyerId);

// Update a project
router.post('/:id', upload.fields(
    [{ name: 'attachments', maxCount: 5 }]
), updateProject);
router.delete("/delete-image", removeImage)
// Filter projects by status
router.get("/search/query", filterProjectsByStatus);

// Search projects
router.get('/search/query/status', searchProjects);
router.post("/chat/all-single-chat", getAllSingleChat)
router.get("/chat/get-all-chat", getAllChat)
router.get("/notification/all-notification", getAllNotification)
router.get("/notification/seen-notification", seenNotification)
export default router;