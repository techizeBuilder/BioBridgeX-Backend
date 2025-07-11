export function sendSingleEmailNotification() {
    const mailTemplete = NotificationTemplate(admin.name, "Milestone Status Updated", `Milestone Done - ${payment.milestone}`, "https://oncload.com", "BioBridge")
    const mailOptions = {
        email: admin.email,
        subject: "Milestone Status Updated",
        html: mailTemplete,
    };
    sendEmail(mailOptions)
}