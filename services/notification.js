import Notification from "../models/notificationModel.js";

class NotificationService {
  constructor(instance) {
    this.io = instance;
    this.userSockets = new Map();

  }

  // Add user socket connection
  addUserSocket(userId, socketId) {
    this.userSockets.set(userId, socketId)
  }

  // Remove user socket connection
  removeUserSocket(socketId) {
    for (const [userId, sockets] of this.userSockets) {
      if (socketId == sockets) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  // Send notification to specific user
  async sendUserNotification(userId, eventType, data) {
    const user = this.userSockets.get(userId);
    if (!user) return false;

    // Send real-time notification
    if (this.userSockets.has(userId)) {
      console.log(this.io)
      this.io.to(user).emit('notification', {
        type: eventType,
        data,
        timestamp: new Date()
      });
      await Notification.create({
        userId,
        eventType,
        data,
        isRead: false
      });

    } else {
      await Notification.create({
        userId,
        eventType,
        data,
        isRead
      });
    }

    // Send email notification
    // await this.sendEmail(user, eventType, data);
    return true;
  }


}

export default NotificationService;