const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://54.163.147.226:3000" || "https://tummytales.info";

// Middleware
app.use(cors("https://tummytales.info/user"));
app.use(express.json());

// Nodemailer transporter
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER, // Your Gmail email
		pass: process.env.EMAIL_PASS  // Your Gmail App Password
	}
});

// HTML Email Template Function
const generateEmailTemplate = (referralName, referal_code, permissions, role) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Health Tracking Referral</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
            .container { max-width: 600px; background: white; padding: 20px; margin: auto; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background: #ff4081; color: white; text-align: center; padding: 15px; border-radius: 10px 10px 0 0; }
            .content { text-align: center; padding: 20px; }
            .button { display: inline-block; padding: 12px 20px; background: #ff4081; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px; }
            .footer { text-align: center; font-size: 12px; color: #888; margin-top: 10px; }
            @media (max-width: 600px) {
                .container { width: 90%; }
                .button { width: 100%; display: block; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Pregnancy Health Tracker</h2>
            </div>
            <div class="content">
                <p><strong>${referralName}</strong> has invited you to track and monitor her health progress and medication.</p>
                <p>Click below to register or log in and start tracking her journey.</p>
                <a href="${FRONTEND_URL}/supporter-register?referal_code=${referal_code}&permissions=${permissions}&role=${role}" class="button">Join Now</a>
            </div>
            <div class="footer">
                <p>If you didn't request this email, please ignore it.</p>
            </div>
        </div>
    </body>
    </html>
`;

// API Endpoint to Send Referral Emails
app.post("/mail/mail/send-referal", async (req, res) => {
	try {
		console.log("\n--- Incoming Request ---");
		console.log("Request Body:", req.body);

		const { supporters, referralName, referal_code } = req.body;
		if (!Array.isArray(supporters) || supporters.length === 0) {
			console.log("❌ Invalid request: supporters array is missing or empty.");
			return res.status(400).json({ error: "An array of supporters (email, permissions, role) is required." });
		}

		// Validate each supporter
		for (const supporter of supporters) {
			const { email, permissions, role } = supporter;
			if (!email || !permissions || !role) {
				console.log(`❌ Missing required fields for:`, supporter);
				return res.status(400).json({ error: "Each supporter must have email, permissions, and role." });
			}
		}

		console.log("✅ All supporters validated. Sending emails...");

		// Send referral emails in parallel
		const emailPromises = supporters.map(({ email, permissions, role }) => {
			const mailOptions = {
				from: process.env.EMAIL_USER,
				to: email,
				subject: "You're Invited to Track Pregnancy Health Progress",
				html: generateEmailTemplate(referralName, referal_code, permissions, role)
			};

			console.log("\n--- Sending Email ---");
			console.log("To:", email);
			console.log("Referral Name:", referralName);
			console.log("Referral Code:", referal_code);
			console.log("Permissions:", permissions);
			console.log("Role:", role);

			return transporter.sendMail(mailOptions);
		});

		// Wait for all emails to be sent
		const results = await Promise.allSettled(emailPromises);

		console.log("\n--- Email Sending Results ---");
		const response = results.map((result, index) => {
			const { email } = supporters[index];
			if (result.status === "fulfilled") {
				console.log(`✅ Email sent successfully to: ${email}`);
				return { email, message: `Referral sent to ${email}` };
			} else {
				console.error(`❌ Failed to send email to: ${email}`);
				console.error("Error:", result.reason);

				const errorMessage =
					result.reason.response?.status === 400
						? "Invalid request. Please check the input values."
						: "Failed to send referral.";
				return { email, error: errorMessage };
			}
		});

		return res.status(200).json({ results: response });

	} catch (error) {
		console.error("\n❌ Error in sending referral emails:", error);
		res.status(500).json({ error: "Internal server error." });
	}
});

// Health check or default route
app.get("/", (req, res) => {
	res.send(`✅ 🚀Mail Server running on port ${PORT}`);
});


// Start Server
app.listen(PORT, () => {
	console.log(`\n🚀 Server running on port ${PORT}`);
});
