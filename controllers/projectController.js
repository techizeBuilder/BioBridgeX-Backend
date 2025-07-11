import User from "../models/admin.js";
import chats from "../models/chat.js";
import Notification from "../models/notificationModel.js";
import Project from "../models/project.js";
import { chatIdgenrater } from "../services/chat.js";
import sendEmail from "../utils/email.js";
import { NotificationTemplate } from "../utils/EmailTemplates/notificationtemp.js";
import { sendMail } from "../utils/mail.js";
import { notificationServiceInstance } from "../utils/socketserver.js";

const generateProjectCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${timestamp}${randomPart}`.substring(0, 6);
};

export const createProject = async (req, res) => {
    try {
        const { userId } = req.user;
        const { files } = req;
        let attachmentsUploads = []
        // if (files?.attachments?.length > 0) {
        //     attachmentsUploads = await Promise.all(
        //         files.attachments.map(async (file) => {
        //             const uploadCert = `/public/uploads/${file.filename}`;
        //             return {
        //                 name: file.originalname,
        //                 filePath: uploadCert,
        //             };
        //         })
        //     );
        // }

        // const project = new Project({
        //     ...req.body,

        //     status: "Pending",
        //     buyerId: userId,
        //     attachments: attachmentsUploads,
        // });

        let projectCode;
        let isUnique = false;

        while (!isUnique) {
            projectCode = generateProjectCode();
            const existingProject = await Project.findOne({ projectCode });
            if (!existingProject) {
                isUnique = true;
            }
        }

        if (files?.attachments?.length > 0) {
            attachmentsUploads = await Promise.all(
                files.attachments.map(async (file) => {
                    const uploadCert = `/public/uploads/${file.filename}`;
                    return {
                        name: file.originalname,
                        filePath: uploadCert,
                    };
                })
            );
        }

        // Create the project with the unique projectCode
        const project = new Project({
            ...req.body,
            projectCode,
            attachments: attachmentsUploads,
            createdBy: userId,
            buyerId: userId
        });
        const admin = (await User.find({ role: "admin" }).select("_id name email"))
        const adminids = admin.map(user => user._id.toString());
        console.log("admng", adminids)
        adminids.forEach(async (adminid) => {
            notificationServiceInstance.sendUserNotification(adminid, "PROJECT_CREATED", {
                userId: adminid,
                title: `New Project Created - ${project.title}`,
                description: `${process.env.DOMAIN}/admin/projects/${project._id}`,
            });
        })
        console.log("admng1", adminids)
        admin.forEach(async (admin) => {
            const mailTemplete = NotificationTemplate(admin.name, "New Project Created", project.title, "https://oncload.com", "BioBridge")
            const mailOptions = {
                email: admin.email,
                subject: "New Project Created",
                html: mailTemplete,
            };
            sendEmail(mailOptions)
        })

        await project.save();
        res.status(201).json(project);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
};

// Get all projects
export const getAllProjects = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const projects = await Project.find()
            .populate({
                path: "buyerId",
                select: "name email",
                model: "buyer",
            })
            .populate({
                path: "assignedTo",
                select: "name email",
                model: "cro",
            })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const totalProjects = await Project.countDocuments();
        const totalPages = Math.ceil(totalProjects / limit);

        res.json({
            status: true,
            message: "All projects fetched successfully",
            projects,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProjects,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a single project by ID
export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate({
                path: "buyerId",
                select: "name email",
                model: "buyer",
            })
            .populate({
                path: "assignedTo",
                select: "name email",
                model: "cro",
            });

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        const projectWithUnseenChats = await Promise.all(
            project.assignedTo.map(async (cro) => {
                console.log(cro)
                const unseenChats = await chats.find({
                    projectid: project._id.toString(),
                    sender: cro._id.toString(),
                    seen: false
                });
                return {
                    ...cro.toObject(),
                    _id: cro._id.toString(),
                    unseenChats: unseenChats.length
                };
            })
        );

        const result = {
            ...project.toObject(),
            _id: project._id.toString(),
            assignedTo: projectWithUnseenChats
        };

        res.json({ status: true, project: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get projects by buyer ID
export const getProjectsByBuyerId = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const { userId } = req.user;
        const projects = await Project.find({ buyerId: userId }).skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const totalProjects = await Project.countDocuments({ buyerId: userId });
        const totalPages = Math.ceil(totalProjects / limit);
        res.json({
            success: true,
            data: projects, pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProjects,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a project
export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { files } = req;
        let attachmentsUploads;
        if (files.attachments) {
            attachmentsUploads = await Promise.all(
                files.attachments.map(async (file) => {
                    const uploadCert = `/public/uploads/${file.filename}`;
                    return {
                        name: file.originalname,
                        filePath: uploadCert.secure_url,
                    };
                })
            );
        }

        const updatedProject = await Project.findOneAndUpdate(
            { _id: id },
            { ...req.body, attachments: attachmentsUploads },
            { new: true }
        );

        if (!updatedProject) {
            return res.status(404).json({ error: "Project not found" });
        }

        return res.status(200).json({
            message: "Project updated successfully",
            data: updatedProject,
        });
    } catch (error) {
        console.error("Update error:", error);
        return res.status(500).json({
            error: error.message || "Failed to update project",
        });
    }
};

// Mark messages as seen for a specific CRO and project
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { projectId, croId } = req.params;

        // Update all unseen messages to seen=true
        const result = await chats.updateMany(
            {
                projectid: projectId,
                sender: croId,
                seen: false
            },
            {
                $set: { seen: true }
            }
        );

        res.json({
            status: true,
            message: "Messages marked as seen",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
export const removeImage = async (req, res) => {
    try {
        const { pid, iid } = req.query;

        // Validate input parameters
        if (!pid || !iid) {
            return res.status(400).json({
                error: "Project ID and Image ID are required"
            });
        }

        // Find the project
        const project = await Project.findById(pid);
        if (!project) {
            return res.status(404).json({
                error: "Project not found"
            });
        }

        // Check if image exists in project
        const imageToDelete = project.attachments.find(
            { _id: iid }
        );

        if (!imageToDelete) {
            return res.status(404).json({
                error: "Image not found in project"
            });
        }

        delteOncloud(imageToDelete.filePath);

        const updatedAttachments = project.attachments.filter(
            img => img._id.toString() !== iid
        );

        await Project.updateOne(
            { _id: pid },
            { $set: { attachments: updatedAttachments } }
        );

        return res.status(200).json({
            message: "Image deleted successfully",
            remainingImages: updatedAttachments.length
        });

    } catch (error) {
        console.error("Image deletion error:", error);
        return res.status(500).json({
            error: error.message || "Failed to delete image"
        });
    }
};

// Filter projects by status
export const filterProjectsByStatus = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const { status } = req.query;
        const projects = await Project.find({ status }).skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const totalProjects = await Project.countDocuments({ status });
        const totalPages = Math.ceil(totalProjects / limit);
        res.json({
            status: true,
            projects,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProjects,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Search projects by title or description
export const searchProjects = async (req, res) => {
    try {
        const { q, page = 1, limit = 10 } = req.query;

        const projects = await Project.find({
            $or: [
                { title: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
            ],
        })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const totalProjects = await Project.countDocuments({
            $or: [
                { title: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
            ],
        });

        const totalPages = Math.ceil(totalProjects / limit);

        res.json({
            success: true,
            data: projects,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProjects,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllSingleChat = async (req, res) => {
    try {
        const { croId, buyerId, projectId } = req.body
        const chatId = chatIdgenrater(buyerId, croId)
        const allChat = await chats.find({
            chatid: chatId,
            projectid: projectId
        })

        return res.status(200).send({
            message: "all chat retrieve successfully",
            data: allChat
        })
    } catch (error) {
        console.log(error)
    }
}

export const getAllChat = async (req, res) => {
    try {
        const { croId, buyerId, projectId } = req.query;
        const chatId = chatIdgenrater(buyerId, croId)
        const allChat = await chats.find({
            chatid: chatId,
            projectid: projectId
        }).sort({ createdAt: -1 });
        return res.status(200).send({
            message: "all chat retrieved successfully",
            data: allChat
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
};

export const getAllNotification = async (req, res) => {
    try {
        const { userId } = req.user;
        const { page = 1, limit = 100 } = req.query;

        const totalNotification = await Notification.countDocuments({ userId });

        const notifications = await Notification.find({ userId })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        return res.status(200).send({
            message: "All notifications retrieved successfully",
            data: notifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalNotification / limit),
                totalNotification: totalNotification,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
};

export const seenNotification = async (req, res) => {
    try {

        const { userId } = req.user;

        const notification = await Notification.updateMany(
            { userId: userId },
            { isRead: true },
            { new: true }
        )


        return res.status(200).send({
            message: "Notification marked as seen",
            data: notification,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}
