const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require("axios");
const User = require('../model/User.js');
const UserDetails = require('../model/User.js');
const sendEmail = require("../utils/sendEmail.js"); // Create this helper
const crypto = require("crypto");
const sendReferralEmail = require("../utils/sendReferralEmail.js");
const sendResetEmail= require("../utils/sendResetEmail.js")

const createUser = async (req, res) => {
	try {
	  const { user_name, email, password, confirm_password, role, referal_code, permissions = [] } = req.body;
  
	  // Validate role
	  if (!["mom", "supporter"].includes(role)) {
		return res.status(400).json({ message: "Invalid role. Must be 'mom' or 'supporter'." });
	  }
  
	  // Check if user already exists
	  const existingUser = await UserDetails.findOne({ $or: [{ email }, { user_name }] });
	  if (existingUser) {
		return res.status(400).json({ message: "Email or username already in use." });
	  }
  
	  // Password match
	  if (confirm_password !== password) {
		return res.status(400).json({ message: "Passwords do not match." });
	  }
    // Strong password validation using regex
	  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
	  if (!strongPasswordRegex.test(password)) {
		return res.status(400).json({
		  message:
			"Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
		});
	  }
	  // Validate required fields
	  const requiredFields = { user_name, email, password, ...(role === "supporter" && { referal_code, permissions }) };
	  const missingFields = Object.entries(requiredFields)
		.filter(([_, value]) => !value)
		.map(([key]) => key);
  
	  if (missingFields.length > 0) {
		return res.status(400).json({ message: `Missing fields: ${missingFields.join(", ")}` });
	  }
  
	if (role === "supporter") {
	  const existingMom = await UserDetails.findById(referal_code);
	  if (!existingMom) {
		return res.status(404).json({ message: `Invalid referral code: ${referal_code}` });
	  }
	
	  // ✅ Check if the supporter was referred by the mom
      const referredEmailFound = existingMom.referals.some(
        ref => ref.referal_email === email && ref.status === "pending"
      );

      if (!referredEmailFound) {
        return res.status(403).json({
          message: "You are not authorized to register. This email was not referred by the mom."
        });
      }
    }

  
	  // Generate 6-digit OTP
	  const otp = Math.floor(100000 + Math.random() * 900000).toString();
	  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry
  
	  // Create user (status = unverified)
	  const user = new UserDetails({
		user_name,
		email,
		password,
		role,
		referal_code: role === "supporter" ? referal_code : null,
		permissions,
		otp,
		otpExpiresAt,
		status: "unverified"
	  });
  
	  await user.save();
  
	  // Send OTP email
	//  await sendEmail(email, `Your OTP Code`, `Your OTP for verification is: ${otp}`);
	await sendEmail(email, `Your OTP Code`, otp, email);

	  return res.status(201).json({
		message: "User created. OTP sent to email for verification.",
		user: {
		  userId: user._id,
		  email: user.email,
		  role: user.role,
		  status: user.status
		}
	  });
	  
	 // return res.status(201).json({ message: "User created. OTP sent to email for verification." });
	} catch (err) {
	  return res.status(500).json({ message: err.message });
	}
  };
// ✅ 2. Login + Send MFA OTP
const loginUser = async (req, res) => {
  const { emailOrUsername, password } = req.body;

  try {
    const user = await User.findOne({ $or: [{ email: emailOrUsername }, { user_name: emailOrUsername }] });
    if (!user) return res.status(404).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    if (user.status !== "verified") {
      return res.status(403).json({ message: "Email not verified. Please verify OTP." });
    }

    // Send MFA OTP
    const mfaOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const mfaOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.mfaOtp = mfaOtp;
    user.mfaOtpExpiresAt = mfaOtpExpiresAt;
    await user.save();

    await sendEmail(user.email, `Your Login OTP Code`, mfaOtp, user.email);

    res.status(200).json({
      message: "OTP sent for login verification.",
      email: user.email,
      role: user.role,
      userId: user._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ 3. Verify OTP (Signup or MFA)
const verifyOtp = async (req, res) => {
  const { email, otp, mode } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    // MFA
    if (mode === 'login') {
      if (user.mfaOtp !== otp || user.mfaOtpExpiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }
      user.mfaOtp = undefined;
      user.mfaOtpExpiresAt = undefined;
      await user.save();
    } else {
      // Signup verification
      if (user.status === "verified") {
        return res.status(400).json({ message: "Already verified." });
      }
      if (user.otp !== otp || user.otpExpiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }
      user.status = "verified";
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();

      if (user.role === "supporter" && user.referal_code) {
        const mom = await User.findById(user.referal_code);
        const referral = mom?.referals?.find(r => r.referal_email === user.email);
        if (referral && referral.status === "pending") {
          referral.status = "accepted";
          await mom.save();
        }
      }
    }

    const payload = {
      userId: user._id,
      role: user.role,
      effectiveUserId: user.role === "supporter" && user.referal_code ? user.referal_code : user._id,
    };
    if (user.role === "supporter") payload.referal_code = user.referal_code;

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.status(200).json({
      message: "OTP verified successfully.",
      token,
      userId: user._id,
      userName: user.user_name,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ 4. Unified Resend OTP
const resendOtp = async (req, res) => {
  const { email, mode } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (mode === 'login') {
      user.mfaOtp = otp;
      user.mfaOtpExpiresAt = otpExpires;
    } else {
      if (user.status === "verified") {
        return res.status(400).json({ message: "User already verified." });
      }
      user.otp = otp;
      user.otpExpiresAt = otpExpires;
    }

    await user.save();
    await sendEmail(email, `Your OTP Code`, otp, email);
    return res.status(200).json({ message: "OTP resent." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ 5. Unified Get OTP
const getOtpByEmail = async (req, res) => {
  const { email, mode } = req.query;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  const otpField = mode === 'login' ? user.mfaOtp : user.otp;
  const expiry = mode === 'login' ? user.mfaOtpExpiresAt : user.otpExpiresAt;

  if (!otpField || expiry < new Date()) {
    return res.status(400).json({ message: "OTP expired or missing" });
  }

  return res.status(200).json({ otp: otpField });
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = jwt.sign(
      { user_id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendResetEmail(user.email, user.user_name, resetLink);

    return res.json({ message: "Reset link sent to email." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.query;
  const { password, confirmPassword } = req.body;

  if (!token) return res.status(400).json({ message: 'Token is required' });
  if (password !== confirmPassword)
    return res.status(400).json({ message: 'Passwords do not match' });

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({
      message:
        'Password must be 8+ chars, with uppercase, lowercase, and number.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.user_id, email: decoded.email });
    if (!user) return res.status(404).json({ message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    return res.json({ message: 'Password reset successful.' });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }
};


const googleCallback = async (req, res) => {
	try {
		if (!req.user) {
			return res.status(400).send({ error: "Authentication failed. No user found." });
		}

		const user = req.user;
     // ✅ Mark user as verified if not already
    if (user.status !== "verified") {
      user.status = "verified";
      await user.save();
    }
		const token = jwt.sign(
			{ userId: user._id, email: user.email, user_name: user.user_name, role: user.role, permissions: user.permissions },
			process.env.JWT_SECRET,
			{ expiresIn: '1d' }
		);
		res.redirect(`${process.env.FRONTEND_URL}?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`);
	} catch (error) {
		console.error("Error in googleCallback:", error);
		res.status(500).send({ error: "Internal server error..." });
	}
};

const facebookCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).send({ error: "Authentication failed. No user found." });
    }

    const user = req.user;
      // ✅ Mark user as verified if not already
    if (user.status !== "verified") {
      user.status = "verified";
      await user.save();
    }

    const payload = {
      userId: user._id,
      email: user.email,
      user_name: user.user_name,
      role: user.role,
      permissions: user.permissions || [],
      effectiveUserId:
        user.role === "supporter" && user.referal_code
          ? user.referal_code
          : user._id,
    };

    if (user.role === "supporter" && user.referal_code) {
      payload.referal_code = user.referal_code;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.redirect(`${process.env.FRONTEND_URL}?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`);
  } catch (error) {
    console.error("Error in facebookCallback:", error);
    res.status(500).send({ error: "Internal server error..." });
  }
};

//supporters
const referSupporter = async (req, res) => {
  try {
    const referals = req.body; // Accept as array of referal objects directly

    if (!Array.isArray(referals) || referals.length === 0) {
      return res.status(400).send({ error: "An array of referals is required." });
    }

    const user = await UserDetails.findById(req.user.userId);
    if (!user) return res.status(404).send({ error: "User not found." });

    const newReferals = [];
    const emailsToResend = [];

    for (const ref of referals) {
      const { referal_email, permissions, role, relation, first_name, last_name } = ref;

      if (!referal_email || !permissions || !role) {
        return res.status(400).send({
          error: "Each referal must include referal_email, permissions, and role.",
        });
      }

      const existingReferral = user.referals?.find(r => r.referal_email === referal_email);

      if (existingReferral) {
        if (existingReferral.status === "accepted") continue;

        // Prepare for resend
        emailsToResend.push({
          referal_email,
          permissions,
          role,
          relation: existingReferral.relation || relation || "",
          first_name: existingReferral.first_name || first_name || "",
          last_name: existingReferral.last_name || last_name || "",
        });

        // Increment resend count
        existingReferral.resentCount = (existingReferral.resentCount || 0) + 1;
      } else {
        // New referal entry
        newReferals.push({
          referal_email,
          permissions,
          role,
          relation: relation || "",
          first_name: first_name || "",
          last_name: last_name || "",
          referal_code: req.user.userId,
          status: "pending",
          sentAt: new Date(),
          resentCount: 0,
        });
      }
    }

    if (newReferals.length > 0) {
      user.referals.push(...newReferals);
      await user.save();
    }

    const referralName = req.user.user_name;
    const referal_code = req.user.userId;

    const allToSend = [...newReferals, ...emailsToResend];

    if (allToSend.length === 0) {
      return res.status(200).json({ message: "No new or pending referrals to send." });
    }

    const results = await sendReferralEmail(allToSend, referralName, referal_code);

    const response = results.map((result, index) => {
      const { referal_email } = allToSend[index];
      return result.status === "fulfilled"
        ? { referal_email, message: "Referral sent successfully" }
        : { referal_email, error: result.reason?.message || "Failed to send" };
    });

    return res.status(200).json({ results: response });
  } catch (error) {
    console.error("Error in referSupporter:", error);
    res.status(500).send({ error: "Internal server error." });
  }
};

const getReferals = async (req, res) => {
  try {
    const userId = req.user.userId; // assuming auth middleware sets req.user.userId

    const user = await UserDetails.findById(userId).select("referals");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return referrals array as-is or format if needed
    return res.status(200).json({ referals: user.referals });
  } catch (error) {
    console.error("Error fetching referals:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const editReferal = async (req, res) => {
  try {
    const { referal_email, permissions, relation, first_name, last_name } = req.body;
    const mom = await UserDetails.findById(req.user.userId);

    if (!mom) return res.status(404).send({ error: "Mom not found" });

    const referal = mom.referals.find(r => r.referal_email === referal_email);
    if (!referal) return res.status(404).send({ error: "Referral not found" });

    // Prevent email change
    // if (req.body.referal_email !== referal.referal_email) return res.status(400).send({ error: "Email cannot be changed" });

    // Update allowed fields
    if (permissions) referal.permissions = permissions;
    if (relation !== undefined) referal.relation = relation;
    if (first_name !== undefined) referal.first_name = first_name;
    if (last_name !== undefined) referal.last_name = last_name;

    await mom.save();

    // If already accepted, also update supporter’s permissions
    if (referal.status === "accepted") {
      const supporter = await UserDetails.findOne({ email: referal_email });
      if (supporter) {
        supporter.permissions = permissions;
        await supporter.save();
      }
    }

    return res.status(200).send({ message: "Referral updated successfully",referal });
  } catch (err) {
    console.error("Error in editReferal:", err);
    res.status(500).send({ error: "Internal server error" });
  }
};

const deleteReferal = async (req, res) => {
  try {
    const { referal_email } = req.body;
    const mom = await UserDetails.findById(req.user.userId);

    if (!mom) return res.status(404).send({ error: "Mom not found" });

    // Check if referral exists
    const referalIndex = mom.referals.findIndex(
      r => r.referal_email === referal_email
    );
    if (referalIndex === -1)
      return res.status(404).send({ error: "Referral not found" });

    // Remove from mom's referals array
    mom.referals.splice(referalIndex, 1);
    await mom.save();

    // Try deleting the supporter account
    const supporter = await UserDetails.findOne({ email: referal_email });
    if (supporter) {
      await UserDetails.findByIdAndDelete(supporter._id);
    }

    return res
      .status(200)
      .send({ message: "Referral and supporter account deleted successfully" });
  } catch (err) {
    console.error("Error in deleteReferal:", err);
    res.status(500).send({ error: "Internal server error" });
  }
};

//used for testing be
const getallusers = async (req,res)=>{
	try{
		const users = await User.find();

		return res.status(200).json({ success:true,users})

	}catch(error){
		console.error('Failed to get allusers',error);
		return res.status(505).json({error:"Failed to retrive users"})
	}
}

// Delete all users
const deleteAllUsers = async (req, res) => {
	try {
		const result = await User.deleteMany({});
		res.json({ message: 'All users deleted successfully', deletedCount: result.deletedCount });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};



module.exports = {verifyOtp,getOtpByEmail, resendOtp ,facebookCallback, googleCallback,
  deleteAllUsers,forgotPassword,resetPassword, getallusers, loginUser, createUser,
	referSupporter,getReferals,editReferal,deleteReferal }


  //   const verifyOtp = async (req, res) => {
// 	try {
// 	  const { email, otp } = req.body;
  
// 	  if (!email || !otp) {
// 		return res.status(400).json({ message: "Email and OTP are required." });
// 	  }
  
// 	  const user = await User.findOne({ email });
  
// 	  if (!user) {
// 		return res.status(404).json({ message: "User not found." });
// 	  }
  
// 	  if (user.status === "verified") {
// 		return res.status(400).json({ message: "User is already verified." });
// 	  }
  
// 	  if (user.otp !== otp) {
// 		return res.status(400).json({ message: "Invalid OTP." });
// 	  }
  
// 	  if (user.otpExpiresAt < new Date()) {
// 		return res.status(400).json({ message: "OTP has expired." });
// 	  }
  
// 	  // Mark user as verified
// 	  user.status = "verified";
// 	  user.otp = undefined;
// 	  user.otpExpiresAt = undefined;
// 	  await user.save();
  
//     // ✅ IF ROLE IS SUPPORTER: Update mom's referals list
//     if (user.role === "supporter" && user.referal_code) {
//       const mom = await UserDetails.findById(user.referal_code);
//       if (mom) {
//         const referalEntry = mom.referals.find(r => r.referal_email === user.email);
//         if (referalEntry && referalEntry.status === "pending") {
//           referalEntry.status = "accepted";
//           await mom.save();
//         }
//       }
//     }
// 	   // ✅ Build payload for token
//     const payload = {
//       userId: user._id,
//       role: user.role,
// 	   effectiveUserId: user.role === "supporter" && user.referal_code
//         ? user.referal_code           // mom's ID if supporter
//         : user._id                   // self if mom
//     };

//     // Include referal_code for supporter so effectiveUserId can be derived
//     if (user.role === "supporter" && user.referal_code) {
//       payload.referal_code = user.referal_code;
//     }
// 	  // Optionally issue a token now
// 	  const token = jwt.sign(
// 		payload,
// 		process.env.JWT_SECRET || "your_secret_key",
// 		{ expiresIn: "1h" }
// 	  );
  
// 	  return res.status(200).json({
// 		message: "Email verified successfully. You can proceed with your profile now.",
// 		token,
// 		userId: user._id,
// 		userName: user.user_name,
// 		email: user.email,
// 		role: user.role,
// 		permissions: user.permissions
// 	  });
  
// 	} catch (err) {
// 	  return res.status(500).json({ message: err.message });
// 	}
//   };
  
// const getOtpByEmail = async (req, res) => {
//   const { email } = req.query;
//   if (!email) return res.status(400).json({ message: "Email required" });

//   const user = await User.findOne({ email });
//   if (!user) return res.status(404).json({ message: "User not found" });

//   if (user.status === "verified") {
//     return res.status(400).json({ message: "User is already verified" });
//   }

//   if (user.otpExpiresAt < new Date()) {
//     return res.status(400).json({ message: "OTP expired" });
//   }

//   return res.status(200).json({ otp: user.otp });
// };

// const resendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email is required." });
//     }

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     if (user.status === "verified") {
//       return res.status(400).json({ message: "User is already verified." });
//     }

//     // Generate new OTP
//     const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

//     user.otp = newOtp;
//     user.otpExpiresAt = otpExpiresAt;
//     await user.save();

//     // Send new OTP to email
//     await sendEmail(email, `Your New OTP Code`, newOtp, email);

//     return res.status(200).json({ message: "New OTP sent to your email." });
//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// };

// const loginUser = async (req, res) => {
// 	const { emailOrUsername, password } = req.body;

// 	try {
// 		const user = await User.findOne({ $or: [{ email: emailOrUsername }, { user_name: emailOrUsername }] });

// 		if (!user) {
// 			return res.status(404).json({ message: 'Invalid email or password' });
// 		}

// 		const isMatch = await bcrypt.compare(password, user.password);

// 		if (!isMatch) {
// 			return res.status(400).json({ message: 'Invalid email or password' });
// 		}
//   if (user.status !== "verified") {
//       return res.status(403).json({ message: "Email not verified. Please verify OTP." });
//     }

//     const payload = {
//       userId: user._id,
//       email: user.email,
//       user_name: user.user_name,
//       role: user.role,
//       permissions: user.permissions || [],
//       effectiveUserId:
//         user.role === "supporter" && user.referal_code
//           ? user.referal_code
//           : user._id,
//     };

//     if (user.role === "supporter" && user.referal_code) {
//       payload.referal_code = user.referal_code;
//     }

//     const token = jwt.sign(payload, process.env.JWT_SECRET, {
//       expiresIn: '1d',
//     });

//     res.json({
//       message: "Login successful",
//       token,
//       userId: user._id,
//       userName: user.user_name,
//       email: user.email,
//       role: user.role,
//       permissions: user.permissions,
//     });
// 	} catch (err) {
// 		res.status(500).json({ message: err.message });
// 	}
// };



