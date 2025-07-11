import cron from "node-cron";
import sendEmail from "../utils/email.js";
import buyer from "../models/buyer.js";
import Project from "../models/project.js";
import Quote from "../models/quotes.js";
import cro from "../models/cro.js";
import sowUpdateReminder from "../utils/EmailTemplates/sowUploadReminder.js";

let runCount = 0;
const maxRuns = 7;

const cronjobsQuote = () => {
    cron.schedule('30 15 * * *', async () => {
        if (runCount >= maxRuns) {
            console.log("Finished sending 7 reminder emails.");
            return;
        }

        try {
            console.log(`Sending Quote Upload reminder email, Day ${runCount + 1}`);

            const projects = await Project.find({
                status: "Approved",
                assignedTo: { $exists: true, $ne: [] }
            }).populate("assignedTo");

            if (!projects || projects.length === 0) {
                console.log("No approved projects found.");
                return;
            }

            console.log(`Found ${projects.length} approved projects.`);

            for (const project of projects) {
                for (const croId of project.assignedTo) {
                    try {
                        const quoteExists = await Quote.findOne({
                            projectId: project._id,
                            croId: croId._id
                        });

                        if (quoteExists) {
                            console.log(`Quote already exists for project ID: ${project._id} and CRO ID: ${croId._id}`);
                            continue;
                        }

                        const croData = await cro.findById(croId._id);
                        if (!croData) {
                            console.log(`CRO not found for ID: ${croId._id}`);
                            continue;
                        }
                        const buyer = await buyer.findById(project.buyerId)
                        console.log(`Sending email to CRO ID: ${croId._id}, Email: ${croData.email}`);
                        const link = `${process.env.DOMAIN}/cro/projects/${project._id}`;

                        await sendEmail(
                            {
                                email: croData.email,
                                subject: `Action Required: Submit Quote and SOW for Project - ${projects._id}`,
                                html: sowUpdateReminder(croData, project, quoteExists, buyer, link)
                            }
                        )

                        console.log(`Email sent to CRO ID: ${croId._id}`);
                    } catch (innerError) {
                        console.error(`Error processing CRO ID: ${croId._id} for project ID: ${project._id}`, innerError);
                    }
                }
            }
            runCount++;
        } catch (error) {
            console.error("Error fetching projects or sending emails:", error);
        }
    });
};

export default cronjobsQuote;