const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Configure Nodemailer with Brevo SMTP
 */
const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Send an OTP email to the user
 * @param {string} toEmail - Recipient's email address
 * @param {string} otp - The 6-digit OTP
 * @param {string} name - Recipient's name (optional)
 */
const sendOtpEmail = async (toEmail, otp, name = 'User') => {
    const mailOptions = {
        from: `"${process.env.BREVO_SENDER_NAME || 'Shikshalaya'}" <${process.env.BREVO_SENDER_EMAIL}>`,
        to: toEmail,
        subject: "Your Password Reset OTP",
        html: `
            <html>
                <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #333;">Password Reset Request</h2>
                        <p>Hello ${name},</p>
                        <p>You requested a password reset for your Shikshalaya account. Use the following 6-digit OTP to reset your password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px;">${otp}</span>
                        </div>
                        <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                        <p>Best regards,<br>${process.env.BREVO_SENDER_NAME || 'Shikshalaya Team'}</p>
                    </div>
                </body>
            </html>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email through Nodemailer:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendOtpEmail };
