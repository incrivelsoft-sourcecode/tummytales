const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config();

const sendEmail = async (to, subject, otp, email) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify?email=${encodeURIComponent(email)}`;

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
          <td style="background-color: #6a1b9a; text-align: center; padding: 24px;">
            <h2 style="color: #fff;">Verify Your Email Address</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px; color: #333;">
            <p>Hi there,</p>
            <p>Thank you for registering. Please use the OTP below to verify your email address:</p>
            <div style="text-align: center; margin: 20px 0;">
              <div style="
                display: inline-block;
                background-color: #e8f0ff;
                color: #0d47a1;
                font-size: 28px;
                font-weight: 700;
                padding: 16px 30px;
                border-radius: 10px;
                letter-spacing: 4px;
              ">
                ${otp}
              </div>
            </div>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${verifyUrl}" style="
                background-color: #6a1b9a;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              ">Click to Verify</a>
            </p>
            <p style="font-size: 14px; color: #555; text-align: center;">
              OTP is valid for 10 minutes. If you didn’t request this, ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f0f0f0; text-align: center; padding: 16px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} All rights reserved.
          </td>
        </tr>
      </table>
    </div>
  `;

  await transporter.sendMail({
    from: `TummyTales <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  });
};

module.exports = sendEmail;





























// const nodemailer = require("nodemailer");
// const dotenv=require('dotenv');
// dotenv.config();

// const sendEmail = async (to, subject, otp) => {
// const transporter = nodemailer.createTransport({
//       service: "Gmail", // Or your SMTP provider
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });
//     const htmlContent = `
//     <div style="margin: 0; padding: 20px; background-color: #f4f6fa; font-family: 'Segoe UI', Tahoma, sans-serif;">
//       <table style="max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" cellpadding="0" cellspacing="0">
        
//         <!-- Header -->
//         <tr>
//           <td style="background-color: #6a1b9a; text-align: center; padding: 24px;">
//             <h2 style="margin: 0; color: #ffffff; font-size: 24px;">Verify Your Email Address</h2>
//           </td>
//         </tr>
  
//         <!-- Body -->
//         <tr>
//           <td style="padding: 30px; color: #333;">
//             <p style="font-size: 16px; margin: 0 0 16px;">Hi there,</p>
//             <p style="font-size: 16px; margin: 0 0 28px;">Thank you for registering. Please use the OTP below to verify your email address:</p>
  
//             <!-- OTP Block -->
//             <div style="text-align: center; margin: 20px 0;">
//               <div style="
//                 display: inline-block;
//                 background-color: #e8f0ff;
//                 color: #0d47a1;
//                 font-size: 28px;
//                 font-weight: 700;
//                 padding: 16px 30px;
//                 border-radius: 10px;
//                 letter-spacing: 4px;
//                 font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//                 white-space: nowrap;
//               ">
//                 ${otp}
//               </div>
//             </div>
  
//             <p style="font-size: 14px; color: #555; text-align: center; margin-top: 24px;">
//               This OTP is valid for 10 minutes. If you didn’t request this, please ignore the email.
//             </p>
//           </td>
//         </tr>
  
//         <!-- Footer -->
//         <tr>
//           <td style="background-color: #f0f0f0; text-align: center; padding: 16px; font-size: 12px; color: #888;">
//             © ${new Date().getFullYear()} All rights reserved.
//           </td>
//         </tr>
  
//       </table>
//     </div>
//   `;
  
  
//     await transporter.sendMail({
//       from: `TummyTales <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       html: htmlContent,
//     });
//   };
  
//   module.exports = sendEmail;