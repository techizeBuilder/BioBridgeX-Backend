import cron from "node-cron";
import sendEmail from "../utils/email.js";
import Quote from "../models/quotes.js";
import buyer from "../models/buyer.js";
import PurchaseOrder from "../models/purchaseOrder.js";
import poReminder from "../utils/EmailTemplates/poRemainder.js";
import Project from "../models/project.js";
import cro from '../models/cro.js';
import jwt from "jsonwebtoken";

let runCount = 0;
const maxRuns = 7;
const cronjobsPO = () => {
  cron.schedule('31 13 * * *', async () => {
    if (runCount >= maxRuns) {
      console.log("Finished sending 7 reminder emails.");
      return;
    }
    try {
      console.log(`Sending PO upload reminder emails, Day ${runCount + 1}`);

      const quotes = await Quote.find({ buyerStatus: "Approved" });
      if (!quotes || quotes.length === 0) {
        console.log("No approved quotes found.");
        return;
      }
      for (const quote of quotes) {
        const [projectData, buyerData] = await Promise.all([
          Project.findById(quote.projectId),
          buyer.findById(quote.buyerId),
        ]);
        if (!projectData || !buyerData) {
          console.log(`Project or buyer not found for quote ID: ${quote._id}`);
          continue;
        }
        const purchaseOrderExists = await PurchaseOrder.findOne({
          quoteId: quote._id,
        });
        if (purchaseOrderExists) {
          console.log(`Purchase order already exists for quote ID: ${quote._id}`);
          continue;
        }
        const croData = await cro.findById(quote.croId);
        const token = jwt.sign({ userId: buyerData._id, type: buyerData.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const uploadLink = `${process.env.DOMAIN}/buyer/upload-po?quoteId=${quote._id}&token=${token}`;
        await sendEmail({
          email: buyerData.email,
          subject: `Reminder: PO Required for Project - ${projectData._id}`,
          html: poReminder(projectData, buyerData, croData, uploadLink),
        });
        console.log(`Reminder email sent to ${buyerData.email} for quote ID: ${quote._id}`);
      }

      runCount++;
    } catch (error) {
      console.error("Error sending reminder emails:", error.message);
    }
  });
};

export default cronjobsPO;