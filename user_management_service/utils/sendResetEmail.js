const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const sendResetEmail = async (to, userName, resetLink) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlContent = `
    <div style="padding: 20px; background-color: #f4f6fa; font-family: 'Segoe UI', Tahoma, sans-serif;">
      <table style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="background-color:rgb(229, 30, 229); text-align: center; padding: 24px;">
            <h2 style="color: #fff;">Password Reset Request</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px; color: #333;">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password.</p>
            <p>Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetLink}" style="
                background-color:rgb(189, 30, 229);
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              ">Reset Your Password</a>
            </div>
            <p style="font-size: 14px; color: #555;">
              This link is valid for 1 hour. If you didn’t request this, please ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f0f0f0; text-align: center; padding: 16px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} TummyTales. All rights reserved.
          </td>
        </tr>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: `TummyTales <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your password",
    html: htmlContent,
  });
};

module.exports = sendResetEmail;
