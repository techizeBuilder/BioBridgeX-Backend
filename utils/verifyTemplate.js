const verifyTemplate = () => {
    return (`
        
          <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Email Verified</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        text-align: center;
                        padding: 50px;
                    }
                    .container {
                        background: white;
                        padding: 30px;
                        max-width: 500px;
                        margin: auto;
                        border-radius: 8px;
                        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        color: #4B0082; /* Indigo */
                    }
                    p {
                        font-size: 18px;
                        color: #333;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 20px;
                        margin-top: 20px;
                        color: white !important;
                        background-color: #4B0082; /* Indigo */
                        text-decoration: none;
                        font-size: 18px;
                        font-weight: bold;
                        border-radius: 5px;
                        transition: 0.3s;
                    }
                    .button:hover {
                        background-color: #36006A; /* Darker Indigo */
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Email Verified! ✅</h1>
                    <p>Your email has been successfully verified. You can now log in to your account.</p>
                    <a href="https://biobridgex.com/" class="button">Go to Login</a>
                </div>
            </body>
            </html>
        `)
}


export default verifyTemplate