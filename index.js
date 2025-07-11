import express from "express";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projectRoutes.js";
import organizationProfileRoutes from "./routes/organizationProfileRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import followerRoutes from "./routes/followerRoutes.js";
import connectDB from "./db.js";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import croRoutes from "./routes/croRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import http from "http";
import { socketserver } from "./utils/socketserver.js";
import { chat } from "./services/chat.js"
import cronjobsPO from "./jobs/cron-jobs-PO.js";
import cronjobsInvoice from "./jobs/cron-jobs-Invoice.js";
import cronjobsQuote from "./jobs/cron-jobs-Quote.js";


dotenv.config();

const app = express();
const port = process.env.PORT || 3010;
const httpServer = http.createServer(app);

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
    })
);
app.use(express.json());
app.use(morgan("combined"));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.use('/public', express.static('public'));

connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/buyer/project", projectRoutes);
app.use("/api/profiles", organizationProfileRoutes);
app.use("/api/quote", quoteRoutes);
app.use("/api/cro", croRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/purchase-order", purchaseOrderRoutes);
app.use("/api/payment/", paymentRoutes);
app.use("/api/followers", followerRoutes);

app.get("/", (req, res) => {
    res.send("Server is Currently Running");
});

socketserver();
cronjobsPO();
cronjobsInvoice();
cronjobsQuote();
chat();

httpServer.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});