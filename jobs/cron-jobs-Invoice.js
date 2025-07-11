// cronjobs.js
import cron from "node-cron";
import sendEmail from "../utils/email.js";
import buyer from "../models/buyer.js";
import Project from "../models/project.js";
import Payment from "../models/payment.js";
import invoiceReminder from "../utils/EmailTemplates/invoiceReminder.js";

let runCount = 0;
const maxRuns = 7;

const cronjobsInvoice = () => {

    cron.schedule('15 12 * * *', async () => {
        if (runCount >= maxRuns) {
            console.log("Finished sending 7 reminder emails.");
            return;
        }
        try {
            console.log(`Sending Invoice reminder email, Day ${runCount + 1}`);

            const payments = await Payment.find({ status: "Approved", paymentStatus: "Pending" });
            if (!payments || payments.length == 0) {
                console.log("No approved payment found.");
                return;
            }
            console.log(payments)
            for (const payment of payments) {
                console.log(payment.projectId, payment.payeeId)
                const [projectData, buyerData] = await Promise.all([
                    Project.findById(payment.projectId),
                    buyer.findById(payment.payeeId),
                ]);

                if (!projectData && !buyerData) {
                    console.log(projectData, buyerData)
                    console.log("Project or buyer is not found.");
                    return;
                }
                const paymentLink = `${process.env.DOMAIN}/buyer/payments`;
                console.log()
                // Send email using your sendMail function
                await sendEmail({
                    email: buyerData.email,
                    subject: `Payment Reminder: Invoice for Project - ${Quote.projectId}`,
                    html: invoiceReminder(payment, projectData, buyerData, paymentLink)
                });

                console.log(`Reminder email sent to ${buyerData.email}`);
            }

            runCount++;

        } catch (error) {
            console.error("Error sending reminder email:", error.message);
        }
    });
};

export default cronjobsInvoice;
