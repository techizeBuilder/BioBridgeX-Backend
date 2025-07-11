const sowUpdateReminder = (cro,project,quote,buyer,link) => {
    return (`<!DOCTYPE html>
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
                <p>Hi ,${cro.name}</p>
              <p>You’ve been selected for a project opportunity on BioBridgeX. Please submit your Quote/Statement of Work (SOW) to proceed.
                </p>
                <p class="second">Project ID: ${project._id}</p>
               <p class="second">Buyer: ${buyer.name}</p>
               <p class="second">Requested Services: ${project.serviceCategory}</p>
               <p class="second">Please include your scope, pricing, timeline, and compliance certifications.</p>
              <p  class="second">[Submit SOW & Quote] → ${link}</p>
                <div class="footer">
                    <p>Need help formatting your SOW? Reach us at pm@biobridgex.com.</p>
                </div>
            </div>
        </body>
        </html> `)
}

export default sowUpdateReminder