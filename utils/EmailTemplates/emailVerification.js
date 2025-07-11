const emailVerification = (name, verificationLink) => {
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
                <h2>Welcome to BioBridgeX Platform!</h2>
                <p>Hi ${name},</p>
                <p>Thank you for signing up with BioBridgeX – your platform for sourcing preclinical services. Please confirm your email to activate your account:</p>
                <p>If the button above doesn’t work, copy and paste the following link into your browser:</p>
                <p class="link">Confirm My Email - ${verificationLink}</p>
                <p >If you did not initiate this request, feel free to ignore this email.</p>
                <div class="footer">
                    <p>Welcome aboard,</p>
                    <p>The BioBridgeX Team</p>
                    <p> support@biobridgex.com</p>
                </div>
            </div>
        </body>
        </html>
        `)
}

export default emailVerification