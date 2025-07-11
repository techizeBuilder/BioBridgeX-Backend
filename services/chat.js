
import { uploadRes } from "../middleware/cloudinary.js";
import chats from "../models/chat.js";
import crypto from "crypto"
import { instance, notificationServiceInstance } from "../utils/socketserver.js";
import buyer from "../models/buyer.js";
import cro from "../models/cro.js";
import Notification from "../models/notificationModel.js";
import { NotificationTemplate } from "../utils/EmailTemplates/notificationtemp.js";
import sendEmail from "../utils/email.js";
import pLimit from 'p-limit';
const users = new Map()
const isOnline = new Map()
const isOnPage = new Map()

export const chat = () => {
    instance.on("connection", (socket) => {
        const sidFromAuth = socket.handshake.auth.userid;
        if (!sidFromAuth) {
            console.warn("No userId provided during socket handshake.");
            return;
        }

        users.set(sidFromAuth, socket.id);
        isOnline.set(sidFromAuth, true);
        notificationServiceInstance.addUserSocket(sidFromAuth, socket.id)

        socket.on("onPage", ({ userid, pageid }) => {
            if (userid) {
                isOnPage.set(userid, pageid)
            }
            console.log(isOnPage)
        })

        socket.on("sendMessage", (data) => {

            const { message, sender, receiver, projectid, role } = data;
            const receiverSocketId = users.get(receiver);
            if (receiverSocketId) {
                socket.to(receiverSocketId).emit("receiveMessage", {
                    message,
                    sender,
                    receiver,
                    projectid
                });
            }
            const isMessageSeen = isOnPage.has(receiver);
            const pageViewed = isOnPage.get(receiver);
            console.log("isMessageSeen", isMessageSeen)
            // if (!isMessageSeen) {
            console.log("page not viewed")
            instance.to(receiverSocketId).emit("notification", {
                eventType: "New Message",
                data: {
                    title: `You have a new message ${projectid}`,
                    description: role !== 'buyer' ? `${process.env.DOMAIN}/buyer/project-detail/${projectid}` : `${process.env.DOMAIN}/cro/projects/${projectid}`,
                },
                timestamp: new Date(),
                isRead: false
            });
            Notification.create({
                userId: receiver,
                eventType: "New Message",
                data: {
                    title: `You have a new message ${projectid}`,
                    description: role !== 'buyer' ? `${process.env.DOMAIN}/buyer/project-detail/${projectid}` : `${process.env.DOMAIN}/cro/projects/${projectid}`,
                },
                isRead: false
            });
            // }

            if (isMessageSeen && pageViewed === projectid) {
                const senderSocketId = users.get(sender);
                if (senderSocketId) {
                    instance.to(senderSocketId).emit("messageseened", {
                        sender,
                        receiver,
                        projectid
                    });
                }
            } else {
                const isuserOnline = users.get(receiver)
                const senderSocketId = users.get(sender);
                if (senderSocketId && isuserOnline) {
                    instance.to(senderSocketId).emit("messageseened", {
                        sender,
                        receiver,
                        projectid
                    });
                }
            }
            savetodb(message, sender, receiver, projectid, isMessageSeen);
        });

        socket.on("sendFile", async (data) => {
            console.log(data)
            const { fileName, filedata, receiver, sender, projectid } = data
            const uploadTocloud = await uploadRes(filedata, fileName)

            const GetUserSocketId = users.get(receiver)
            if (GetUserSocketId) {
                socket.to(GetUserSocketId).emit("receiveMessage", {
                    sender: sender,
                    receiver: receiver,
                    projectid: projectid,
                    file: uploadTocloud.secure_url
                })
            }
            const ismessageSeen = isOnPage.has(receiver)
            savetodb('', sender, receiver, projectid, ismessageSeen, uploadTocloud.secure_url)
            instance.to(GetUserSocketId).emit("notification", {
                eventType: "New Message",
                data: {
                    title: "You have a new message",
                    description: `${fileName} shared`,
                },
                timestamp: new Date(),
                isRead: false
            });
            Notification.create({
                userId: receiver,
                eventType: "New Message",
                data: {
                    title: "You have a new message",
                    description: `${fileName} shared`,
                },
                isRead: false
            });
            console.log("ismessageseended", ismessageSeen)
            if (ismessageSeen) {
                const GetUserSocketsender = users.get(sender)
                if (GetUserSocketsender) {
                    socket.to(GetUserSocketsender).emit('messageseened', {
                        sender: sender, receiver: receiver, projectid: projectid
                    })
                }
            }
        })

        socket.on("messageRead", async (data) => {
            try {
                const { receiver, sender, projectid } = data;
                console.log(data)
                await chats.updateMany(
                    { sender: sender, receiver: receiver, projectid: projectid },
                    { seen: true },
                    { new: true }
                );
                const GetUserSocketId = users.get(receiver)
                console.log(GetUserSocketId)
                if (GetUserSocketId) {
                    socket.to(GetUserSocketId).emit('messageseened', {
                        sender: sender, receiver: receiver, projectid: projectid
                    })
                }
            } catch (error) {
                console.error("Error updating message read status:", error);
            }
        });
        socket.on("isOnline", (userid) => {
            const status = isOnline.has(userid)
            socket.to(socket.id).emit("Online", {
                userid: status
            })
        })
        socket.on("bulknotification", async (data) => {
            console.log(data)
            const { type } = data
            if (type == "buyer") {
                const allbuyers = await buyer.find({ role: "buyer" }).select("_id name email")
                sendNotification(allbuyers, data, users, instance)

            } else if (type == "cro") {
                const allbuyers = await cro.find({ role: "cro" }).select("_id name email")
                sendNotification(allbuyers, data, users, instance)
            } else if (type == "all") {
                const allbuyers = await buyer.find({ role: "buyer" }).select("_id name email")
                const allcro = await cro.find({ role: "cro" }).select("_id name email")
                const newobject = [...allbuyers, ...allcro]
                sendNotification(newobject, data, users, instance)
            }
        })

        console.log(`User connected: ${sidFromAuth}, socketId: ${socket.id}`);
        socket.on("disconnect", (socket) => {
            isOnline.delete(sidFromAuth);
            users.delete(sidFromAuth);
            isOnPage.delete(sidFromAuth)
            console.log(users)
            console.log(`User disconnected: ${sidFromAuth}`);
        });
    })
}


function savetodb(message = "", sender, receiver, projectid, seen, file) {
    const chatId = chatIdgenrater(sender, receiver)
    if (chatId) {
        chats.create({
            chatid: chatId,
            projectid: projectid,
            message: message,
            receiver: receiver,
            sender: sender,
            seen: seen,
            file: file
        })
    }
}


export async function sendNotification(allbuyers, data, users, instance) {
    const { notification } = data;
    const limit = pLimit(10);

    const tasks = allbuyers.map(buyer => limit(async () => {
        const buyerId = buyer._id.toString();
        const buyerSocketId = users.get(buyerId);

        if (buyerSocketId) {
            instance.to(buyerSocketId).emit("notification", {
                eventType: "admin Notification",
                data: notification,
                timestamp: new Date(),
                isRead: false
            });
        }

        await Notification.create({
            userId: buyer._id,
            eventType: "admin Notification",
            data: notification,
            isRead: false
        });

        const mailTemplate = NotificationTemplate(
            buyer.name,
            notification.title,
            notification.description,
            "https://oncload.com",
            "BioBridge"
        );

        const mailOptions = {
            email: buyer.email,
            subject: "New Announcement",
            html: mailTemplate,
        };

        sendEmail(mailOptions);
    }));

    await Promise.all(tasks);
}

export function chatIdgenrater(userId1, userId2) {
    const combined = userId1 < userId2 ? userId1 + userId2 : userId2 + userId1;
    return crypto.createHash("sha256").update(combined).digest("hex");
}