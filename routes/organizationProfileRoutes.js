import express from 'express';
import {
    createOrganizationProfile,
    getAllOrganizationProfilesById,
    getOrganizationProfileById,
    updateOrganizationProfile,
    filterOrganizationProfiles,
    searchOrganizationProfiles,
    updateCertificateStatus
} from '../controllers/organizationProfileController.js';
import authMiddleware from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create a new organization profile
router.post('/create-organization-profile', upload.fields(
    [{ name: 'masterServiceAgreement', maxCount: 1 }, { name: 'certifications', maxCount: 5 }]
), createOrganizationProfile);

// Get all organization profiles
router.get('/all-organization-profiles/:id', getAllOrganizationProfilesById);

// Get a single organization profile by ID
router.get('/get-organization-profile', getOrganizationProfileById);

// Update an organization profile
router.post('/organization-profile/:id',
    upload.fields(
        [{ name: 'masterServiceAgreement', maxCount: 1 }, { name: 'certifications', maxCount: 5 }]
    ),
    updateOrganizationProfile);

// Filter organization profiles by status
router.get('/organization-profile/search/query', filterOrganizationProfiles);

// Search organization profiles
router.get('/organization-profile/search/query', searchOrganizationProfiles);

// Update verification status
// router.patch('/organization-profile/:id', updateVerificationStatus);

// Update certificate status
router.patch('/update-certificate/status/:id', updateCertificateStatus);

export default router;