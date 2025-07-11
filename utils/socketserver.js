// socketServer.js
import { Server } from "socket.io";
import http from "http";
import NotificationService from "../services/notification.js";

export let instance;
export let notificationServiceInstance;
export const socketserver = () => {

    const httpServer = http.createServer();

    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    instance = io
    notificationServiceInstance = new NotificationService(io);
    const port = 3011;
    httpServer.listen(port, () => {
        console.log(`Socket server running at http://localhost:${port}`);
    });

}