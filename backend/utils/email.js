const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  const smtpUser = process.env.SMTP_USER || 'no-reply@moondoog.com';
  const smtpPassword = process.env.SMTP_PASSWORD;
  
  if (!smtpPassword) {
    throw new Error('SMTP_PASSWORD is not set in environment variables. Please add it to your .env file.');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'moondoog.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // Use SSL/TLS for port 465
    auth: {
      user: smtpUser,
      pass: smtpPassword
    }
  });
};

// Send verification code email
const sendVerificationEmail = async (to, code, studentName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"SSDC Student Portal" <${process.env.SMTP_USER || 'no-reply@moondoog.com'}>`,
      to: to,
      subject: 'Your Verification Code - SSDC Student Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .code { background-color: #ffffff; border: 2px dashed #2563eb; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SSDC Student Portal</h1>
            </div>
            <div class="content">
              <p>Hello ${studentName || 'Student'},</p>
              <p>Thank you for registering with the SSDC Student Portal. Please use the verification code below to complete your registration:</p>
              <div class="code">${code}</div>
              <p>This code will expire in 15 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SSDC Student Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email: ' + error.message);
  }
};

module.exports = {
  sendVerificationEmail,
  createTransporter
};

