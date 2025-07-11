export function NotificationTemplate(name, subject, message, actionUrl, companyName) {
  const year = new Date().getFullYear();

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject || "Notification"}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f5f7fa;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        color: #333;
      }
      .email-wrapper {
        max-width: 480px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .email-header {
        background: #4f46e5;
        padding: 20px;
        text-align: center;
        color: #ffffff;
      }
      .email-header h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
      }
      .email-body {
        padding: 30px 20px;
        font-size: 16px;
        line-height: 1.6;
      }
      .email-body p {
        margin: 0 0 20px;
      }
      .email-footer {
        text-align: center;
        padding: 20px;
        font-size: 12px;
        color: #777;
        background: #f9fafb;
      }
      .button {
        display: inline-block;
        background: #4f46e5;
        color: #ffffff;
        padding: 10px 20px;
        border-radius: 5px;
        text-decoration: none;
        font-weight: 500;
        margin-top: 20px;
      }
        a{
        color: white;
        }
    </style>
  </head>
  <body>
  
    <div class="email-wrapper">

      <div class="email-body">
        <p>Hello ${name || "User"},</p>
  
        <p>${`You have received a new notification regarding your ${message}` || "You have received a new notification regarding your account."}</p>
  
        <p>If you did not expect this notification, please ignore this email.</p>
      </div>
      <div class="email-footer">
        &copy; ${year} ${companyName || "Your Company"}. All rights reserved.
      </div>
    </div>
  
  </body>
  </html>
  `;
}
