const poReminder = (project, buyer, croData, uploadLink) => {
    return (`  <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Verify Your Email</title>
            <style>
                /* Global Styles */
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                  
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                  
                }
                h2 {
                    color: #333;
                    font-size: 24px;
                }
                p {
                    color: #666;
                    font-size: 16px;
                    line-height: 1.5;
                }
               .second{
               margin-top:10px;
               }
            
                .footer {
                          margin-top: 20px;
                    font-size: 14px;
                    color: #888;
              width:100%;
              display:flex;
              flex-direction:column;
              justify-content:start;
              align-items:start;
              
                }
                .link {
                    word-wrap: break-word;
                    font-size: 14px;
                    color: #007BFF;
                    margin-bottom:10px;
                }
      
                /* Responsive Design */
                @media screen and (max-width: 600px) {
                    .container {
                        width: 90%;
                        padding: 15px;
                    }
                    h2 {
                        font-size: 20px;
                    }
                    p {
                        font-size: 14px;
                    }
                    
                    .footer {
                        font-size: 12px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <p>Hi ${buyer.name},</p>
                <p>This is a friendly reminder that your Purchase Order (PO) is still pending for:</p>
                <div class="second">
                <p> Project ID: ${project._id}</p>
                <p>SOW Title: ${project.title}</p>
                <p>CRO: ${croData.name}</p>
                </div>
                <p>Please upload or confirm your PO to avoid delays in study initiation.</p>
                <a href="${uploadLink}" class="link">Upload PO Now</a>
                <p >This link will expire in 60 minutes for security reasons. If you didn’t request this, you can safely ignore this message.</p>
                <div class="footer">
                    <p>Need help? Reach us at support@biobridgex.com.</p>
                </div>
            </div>
        </body>
        </html>
        `)
}

export default poReminder