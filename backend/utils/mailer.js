const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

/**
 * Sends an OTP email to the user.
 * @param {string} to - Recipient email address.
 * @param {string} otp - The 6-digit OTP to send.
 * @returns {Promise<void>}
 */
const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"${process.env.BREVO_SENDER_NAME}" <${process.env.BREVO_SENDER_EMAIL}>`,
    to,
    subject: 'Your Password Reset OTP',
    html: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f9fafb; border-radius: 8px;">
    
    <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
      
      <h2 style="margin-top: 0; color: #111827;">Password Reset Request</h2>
      
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        Dear User,
      </p>

      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        We received a request to reset your password for your <strong>Shikshalaya</strong> account.
        Please use the One-Time Password (OTP) below to proceed with resetting your password.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; padding: 15px 25px; font-size: 28px; font-weight: 600; letter-spacing: 6px; color: #2563eb; background-color: #eff6ff; border: 1px solid #2563eb; border-radius: 6px;">
          ${otp}
        </div>
      </div>

      <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
        This OTP is valid for <strong>10 minutes</strong>. For security reasons, please do not share this code with anyone.
      </p>

      <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you did not request a password reset, please ignore this email or contact our support team immediately.
      </p>

      <hr style="margin: 25px 0; border: none; border-top: 1px solid #e5e7eb;" />

      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        © ${new Date().getFullYear()} Shikshalaya. All rights reserved.<br/>
        This is an automated message. Please do not reply to this email.
      </p>

    </div>
  </div>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${to}`);
  } catch (error) {
    console.error(` Error sending OTP email to ${to}:`, error);
    throw new Error('Failed to send OTP email');
  }
};
/**
 * Sends a notification email to administrators about a new demo request.
 * @param {string} adminEmail - Recipient admin email address.
 * @param {object} demoData - The demo request data.
 * @returns {Promise<void>}
 */
const sendAdminDemoNotification = async (adminEmail, demoData) => {
  const { fullName, email, phoneNumber, message } = demoData;
  const mailOptions = {
    from: `"${process.env.BREVO_SENDER_NAME}" <${process.env.BREVO_SENDER_EMAIL}>`,
    to: adminEmail,
    subject: 'New Book Demo Request - Shikshalaya',
    html: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f9fafb; border-radius: 8px;">
    <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
      <h2 style="margin-top: 0; color: #111827; text-align: center;">New Demo Request</h2>
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        Hello Admin,
      </p>
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        A new demo request has been submitted with the following details:
      </p>
      <div style="background-color: #f4f7ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 5px 0;"><strong>Full Name:</strong> ${fullName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Phone Number:</strong> ${phoneNumber}</p>
        <p style="margin: 5px 0;"><strong>Message:</strong> ${message}</p>
      </div>
      <hr style="margin: 25px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        © ${new Date().getFullYear()} Shikshalaya. All rights reserved.<br/>
        This is an automated notification from the Shikshalaya Admin Panel.
      </p>
    </div>
  </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Admin notification sent successfully to ${adminEmail}`);
  } catch (error) {
    console.error(` Error sending admin notification to ${adminEmail}:`, error);
    // Don't throw here to allow other notifications to proceed if one fails
  }
};

module.exports = { sendOTPEmail, sendAdminDemoNotification };
