// utils/sendReferralEmail.js
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://54.163.147.226:8080" || "https://tummytales.info";

const sendReferralEmail = async (supporters, referralName, referal_code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const generateEmailTemplate = (referralName, referal_code, permissions, role) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; background: white; padding: 20px; margin: auto; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: #ff4081; color: white; text-align: center; padding: 15px; border-radius: 10px 10px 0 0; }
        .content { text-align: center; padding: 20px; }
        .button { display: inline-block; padding: 12px 20px; background: #ff4081; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px; }
        .footer { text-align: center; font-size: 12px; color: #888; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Pregnancy Health Tracker</h2>
        </div>
        <div class="content">
          <p><strong>${referralName}</strong> has invited you to track her health and medications.</p>
          <p>Click below to register or log in and start tracking her journey.</p>
          <a href="${FRONTEND_URL}/supporter-signup?referal_code=${referal_code}&permissions=${permissions}&role=${role}" class="button">Join Now</a>
        </div>
        <div class="footer">
          <p>If you didn't request this email, you can ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailPromises = supporters.map(({ referal_email, permissions, role }) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: referal_email,
      subject: "You're Invited to Track Pregnancy Health Progress",
      html: generateEmailTemplate(referralName, referal_code, permissions, role),
    };
    return transporter.sendMail(mailOptions);
  });

  return Promise.allSettled(emailPromises);
};

module.exports = sendReferralEmail;
