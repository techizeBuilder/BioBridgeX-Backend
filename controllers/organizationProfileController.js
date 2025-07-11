import OrganizationProfile from "../models/organizationProfile.js";
import cro from "../models/cro.js";
import { Types } from 'mongoose';
// Create a new organization profile
// export const createOrganizationProfile = async (req, res) => {
//     const { files } = req;
//     const { userId } = req.user;
//     try {
//         // Upload master service agreement file first


//         const masterServiceAgreementFile = files.masterServiceAgreement[0].filename;
//         const uploadMasterServiceAgreement = `/public/uploads/${masterServiceAgreementFile}`;


//         // Upload certifications - use Promise.all to wait for all uploads to complete

//         const certificationUploads = await Promise.all(files.certifications.map(async (file) => {
//             const uploadCert = `/public/uploads/${file.filename}`;
//             return {
//                 name: file.originalname,
//                 filePath: uploadCert
//             }
//         }));

//         const profile = new OrganizationProfile({
//             ...req.body,
//             masterServiceAgreement: uploadMasterServiceAgreement,
//             certifications: certificationUploads,
//             VerifyStatus: "Pending",
//             croId: userId
//         });
//         await profile.save();
//         await cro.findOneAndUpdate({ _id: userId }, {
//             organizationName: profile.organizationName,
//             businessAddress: profile.billingAddress,
//         });


//         res.status(201).json(profile);
//     } catch (error) {
//         console.error(error);
//         res.status(400).json({ error: error.message });
//     }
// };
export const createOrganizationProfile = async (req, res) => {
    const { files } = req;
    const { userId } = req.user;

    try {
        let uploadMasterServiceAgreement = null;
        let certificationUploads = [];
        let profileData = { ...req.body };

        // Handle expertise data transformation
        if (profileData.expertise) {
            // If expertise is a string (comma-separated), split it into array
            if (typeof profileData.expertise === 'string') {
                profileData.expertise = profileData.expertise.split(',')
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
            }

            // Ensure it's an array and clean it
            if (!Array.isArray(profileData.expertise)) {
                profileData.expertise = [];
            }

            // Remove duplicates and empty values
            profileData.expertise = [...new Set(
                profileData.expertise
                    .filter(item => typeof item === 'string')
                    .map(item => item.trim())
                    .filter(item => item.length > 0)
            )];
        } else {
            profileData.expertise = [];
        }

        // Handle master service agreement if provided
        if (files?.masterServiceAgreement?.[0]) {
            const masterServiceAgreementFile = files.masterServiceAgreement[0].filename;
            uploadMasterServiceAgreement = `/public/uploads/${masterServiceAgreementFile}`;
        }

        // Handle certifications if provided
        if (files?.certifications?.length > 0) {
            certificationUploads = await Promise.all(files.certifications.map(async (file) => {
                const uploadCert = `/public/uploads/${file.filename}`;
                return {
                    name: file.originalname,
                    filePath: uploadCert,
                    verified: false
                };
            }));
        }

        const profile = new OrganizationProfile({
            ...profileData,
            masterServiceAgreement: uploadMasterServiceAgreement,
            certifications: certificationUploads,
            VerifyStatus: "Pending",
            croId: userId
        });

        await profile.save();
        await cro.findOneAndUpdate({ _id: userId }, {
            organizationName: profile.organizationName,
            businessAddress: profile.billingAddress,
        });

        res.status(201).json(profile);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};
// Get all organization profiles
export const getAllOrganizationProfiles = async (req, res) => {
    try {
        const profiles = await OrganizationProfile.find().populate({
            path: 'croId',
            select: 'name email',
            model: 'cro'
        })
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllOrganizationProfilesById = async (req, res) => {
    try {
        const { id } = req.params
        const profiles = await OrganizationProfile.findOne({ croId: id }).populate({
            path: 'croId',
            select: 'name email',
            model: 'cro'
        })
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single organization profile by ID
export const getOrganizationProfileById = async (req, res) => {
    try {
        const { userId } = req.user
        const profile = await OrganizationProfile.findOne({ croId: userId });
        if (!profile) {
            return res.status(404).json({ error: "Organization profile not found" });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update an organization profile
// export const updateOrganizationProfile = async (req, res) => {
//     const { files } = req;
//     const { userId } = req.user;

//     try {
//         let updateData = { ...req.body };

//         // Handle expertise data
//         if (updateData.expertise) {
//             try {
//                 // First try to parse as JSON
//                 if (typeof updateData.expertise === 'string') {
//                     try {
//                         updateData.expertise = JSON.parse(updateData.expertise);
//                     } catch (jsonError) {
//                         // If JSON parse fails, try splitting by comma
//                         updateData.expertise = updateData.expertise.split(',')
//                             .map(item => item.trim())
//                             .filter(item => item.length > 0);
//                     }
//                 }

//                 // Ensure it's an array
//                 if (!Array.isArray(updateData.expertise)) {
//                     updateData.expertise = [];
//                 }

//                 // Clean the array and remove duplicates
//                 updateData.expertise = [...new Set(
//                     updateData.expertise
//                         .filter(item => typeof item === 'string')
//                         .map(item => item.trim())
//                         .filter(item => item.length > 0)
//                 )];

//             } catch (error) {
//                 console.error('Error processing expertise:', error);
//                 updateData.expertise = [];
//             }
//         }

//         // Rest of your update logic remains the same...
//         delete updateData.certifications;

//         if (files?.masterServiceAgreement) {
//             const masterServiceAgreementFile = files.masterServiceAgreement[0].filename;
//             updateData.masterServiceAgreement = `/public/uploads/${masterServiceAgreementFile}`;
//         }

//         if (files?.certifications) {
//             const certificationUploads = await Promise.all(files.certifications.map(async (file) => {
//                 const uploadCert = `/public/uploads/${file.filename}`;
//                 return {
//                     name: file.originalname,
//                     filePath: uploadCert
//                 };
//             }));
//             updateData.certifications = certificationUploads;
//         }

//         const profile = await OrganizationProfile.findOneAndUpdate(
//             { _id: req.params.id, croId: userId },
//             { $set: updateData },
//             { new: true }
//         );

//         if (!profile) {
//             return res.status(404).json({ error: "Organization profile not found" });
//         }

//         if (updateData.organizationName || updateData.billingAddress) {
//             await cro.findOneAndUpdate(
//                 { _id: userId },
//                 {
//                     $set: {
//                         organizationName: updateData.organizationName || profile.organizationName,
//                         businessAddress: updateData.billingAddress || profile.billingAddress,
//                     }
//                 }
//             );
//         }

//         res.json(profile);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: error.message });
//     }
// };
export const updateOrganizationProfile = async (req, res) => {
    const { files } = req;
    const { userId } = req.user;

    try {
        let updateData = { ...req.body };

        // Handle expertise parsing and cleaning
        if (updateData.expertise) {
            try {
                if (typeof updateData.expertise === 'string') {
                    try {
                        updateData.expertise = JSON.parse(updateData.expertise);
                    } catch {
                        updateData.expertise = updateData.expertise.split(',').map(s => s.trim()).filter(Boolean);
                    }
                }
                if (!Array.isArray(updateData.expertise)) updateData.expertise = [];

                updateData.expertise = [...new Set(
                    updateData.expertise
                        .filter(item => typeof item === 'string')
                        .map(item => item.trim())
                        .filter(Boolean)
                )];
            } catch (error) {
                console.error('Error processing expertise:', error);
                updateData.expertise = [];
            }
        }

        // Remove certifications from req.body since handled separately
        delete updateData.certifications;

        // Handle MSA file
        if (files?.masterServiceAgreement) {
            const msaFile = files.masterServiceAgreement[0].filename;
            updateData.masterServiceAgreement = `/public/uploads/${msaFile}`;
        }

        // Fetch current profile to manage existing certs
        const existingProfile = await OrganizationProfile.findOne({
            _id: req.params.id,
            croId: userId,
        });

        let finalCerts = existingProfile?.certifications || [];

        // Convert existing certification objects if passed in body (parsed as string)
        let oldCerts = [];
        if (req.body.oldCertifications) {
            try {
                oldCerts = JSON.parse(req.body.oldCertifications);
            } catch (e) {
                oldCerts = [];
            }
        }

        // Remove deleted files from disk
        const oldFilePaths = oldCerts.map(c => c.filePath);
        finalCerts.forEach(cert => {
            if (!oldFilePaths.includes(cert.filePath)) {
                try {
                    fs.unlinkSync(path.join(process.cwd(), cert.filePath));
                } catch (err) {
                    console.warn('File already removed or error deleting:', err.message);
                }
            }
        });

        // Keep only the remaining old ones
        finalCerts = oldCerts;

        // Add new certification uploads with file info and unique IDs
        if (files?.certifications) {
            const newCerts = await Promise.all(
                files.certifications.map(file => ({
                    _id: new Types.ObjectId(),
                    name: file.originalname,
                    filePath: `/public/uploads/${file.filename}`,
                    verified: false,
                }))
            );
            finalCerts.push(...newCerts);
        }

        updateData.certifications = finalCerts;

        // Final DB update
        const profile = await OrganizationProfile.findOneAndUpdate(
            { _id: req.params.id, croId: userId },
            { $set: updateData },
            { new: true }
        );

        if (!profile) return res.status(404).json({ error: 'Organization profile not found' });

        // Update CRO model fields if changed
        if (updateData.organizationName || updateData.billingAddress) {
            await cro.findOneAndUpdate(
                { _id: userId },
                {
                    $set: {
                        organizationName: updateData.organizationName || profile.organizationName,
                        businessAddress: updateData.billingAddress || profile.billingAddress,
                    }
                }
            );
        }

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
// Filter organization profiles by verification status
export const filterOrganizationProfiles = async (req, res) => {
    try {
        const { VerifyStatus } = req.query;
        const profiles = await OrganizationProfile.find({ VerifyStatus });
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Search organization profiles
export const searchOrganizationProfiles = async (req, res) => {
    try {
        const { q } = req.query;
        const profiles = await OrganizationProfile.find({
            $or: [
                { websitename: { $regex: q, $options: "i" } },
                { location: { $regex: q, $options: "i" } },
            ],
        });
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update verification status
// export const updateVerificationStatus = async (req, res) => {
//     try {
//         const { VerifyStatus } = req.body;
//         const profile = await OrganizationProfile.findByIdAndUpdate(
//             req.params.id,
//             { VerifyStatus },
//             { new: true }
//         );
//         if (!profile) {
//             return res.status(404).json({ error: "Organization profile not found" });
//         }
//         res.json(profile);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };


// Update certificate status
// export const updateCertificateStatus = async (req, res) => {
//     try {
//         const { userId } = req.body;
//         const { id } = req.params;

//         console.log(userId, id);

//         // Find the organization profile by ID
//         const organization = await OrganizationProfile.findOne({ croId: userId });
//         if (!organization) {
//             return res.status(404).json({ error: "Organization not found" });
//         }
//         console.log(organization)
//         // Find the certificate by ID
//         const certificate = organization.certifications.find(cert => cert._id.toString() === id);
//         if (!certificate) {
//             return res.status(404).json({ error: "Certificate not found" });
//         }
//         console.log("bhdcb", certificate)
//         // Update the verified status
//         certificate.verified = true;

//         // Save the updated organization profile
//         await organization.save();

//         res.json({ message: "Certificate status updated successfully", organization });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };
export const updateCertificateStatus = async (req, res) => {
    try {
        const { userId } = req.body;
        const { id } = req.params;

        // Find the organization profile by CRO ID
        const organization = await OrganizationProfile.findOne({ croId: userId });
        if (!organization) {
            return res.status(404).json({ error: "Organization not found" });
        }

        // Find the certificate by ID
        const certificateIndex = organization.certifications.findIndex(
            cert => cert._id.toString() === id
        );

        if (certificateIndex === -1) {
            return res.status(404).json({ error: "Certificate not found" });
        }

        // Update both the specific certification's verified status
        // and the organization's overall VerifyStatus
        organization.certifications[certificateIndex].verified = true;
        // organization.VerifyStatus = 'Approved'; 

        // Save the updated organization profile
        await organization.save();

        res.json({
            message: "Certificate status updated successfully",
            organization
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};