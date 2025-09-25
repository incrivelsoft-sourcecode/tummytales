const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require("axios");
const User = require('../model/User.js');
const UserDetails = require('../model/User.js');
const sendEmail = require("../utils/sendEmail.js"); // Create this helper
const crypto = require("crypto");
const sendReferralEmail = require("../utils/sendReferralEmail.js");
const sendResetEmail= require("../utils/sendResetEmail.js")
require("dotenv").config();

const createUser = async (req, res) => {
	try {
	  const { user_name, email, password, confirm_password, role, referal_code, permissions = [] } = req.body;
  
	  // Validate role
	  if (!["mom", "supporter"].includes(role)) {
		return res.status(400).json({ message: "Invalid role. Must be 'mom' or 'supporter'." });
	  }
  
	  // // Check if user already exists
	  // const existingUser = await UserDetails.findOne({ $or: [{ email }, { user_name }] });
	  // if (existingUser) {
		// return res.status(400).json({ message: "Email or username already in use." });
	  // }
  
    // Check if user already exists (by email or username)
let existingUser = null;
try {
  const existingUserResponse = await axios.get(
    `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/search`,
    {
      params: { email, user_name },
      headers: {
        "X-API-Key": process.env.API_KEY,
        "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
      },
    }
  );
  existingUser = existingUserResponse.data.user; // ✅ now directly user or null
} catch (err) {
  // Only rethrow for actual server errors
  throw err;
}

if (existingUser) {
  return res.status(400).json({ message: "Email or username already in use." });
}

if (existingUser) {
  return res.status(400).json({ message: "Email or username already in use." });
}


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
  // 1️⃣ Fetch mom from Python
  const momResponse = await axios.get(
    `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user`,
    {
      params: { user_id: referal_code },
      headers: {
        "X-API-Key": process.env.API_KEY,
        "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
      },
    }
  );

  const existingMom = momResponse.data;

  if (!existingMom) {
    return res.status(404).json({ message: `Invalid referral code: ${referal_code}` });
  }

	 // 2️⃣ Check supporter email in mom’s referals
  const referredEmailFound = existingMom.referals?.some(
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
  
	  // // Create user (status = unverified)
	  // const user = new UserDetails({
		// user_name,
		// email,
		// password,
		// role,
		// referal_code: role === "supporter" ? referal_code : null,
		// permissions,
		// otp,
		// otpExpiresAt,
		// status: "unverified"
	  // });
  
	  //await user.save();
   // ✅ Build clean payload for Python
    const userPayload = {
  user_name,
  email,
  password,
  role,
  referal_code: role === "supporter" ? referal_code : null,
  permissions,
  otp,
  otpExpiresAt: otpExpiresAt.toISOString(),
  status: "unverified",
};

console.log("Payload sending to Python:", userPayload);
console.log("Final Payload:", JSON.stringify(userPayload, null, 2));

  // Call Python API instead of MongoDB
    const response = await axios.post(
 // "http://localhost:8000/useronboarding/user",
   `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user`,
  userPayload,
  { headers: {
     "Content-Type": "application/json" ,
      "X-API-Key": process.env.API_KEY,   // 👈 set this
      "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,           // 👈 matches your agent
    } }
);

	  // Send OTP email
	//  await sendEmail(email, `Your OTP Code`, `Your OTP for verification is: ${otp}`);
	await sendEmail(email, `Your OTP Code`, otp, email);

	  return res.status(201).json({
  message: "User created. OTP sent to email for verification.",
  user: {
    user_name,
    email,
    role,
    status: "unverified"
  }


	  });
    } catch (err) {
  const errData = err.response?.data;
  console.error("Full Python API error:\n", JSON.stringify(errData, null, 2));

  // Pretty-print the validation fields (if present)
  if (errData?.detail && Array.isArray(errData.detail)) {
    errData.detail.forEach(d => {
      const loc = Array.isArray(d.loc) ? d.loc : (d.location || []);
      // remove leading "body" if present
      const fieldPath = Array.isArray(loc) ? loc.slice(loc[0]==="body"?1:0).map(x => String(x)).join('.') : String(loc);
      console.error(`Validation -> field: ${fieldPath} | msg: ${d.msg} | type: ${d.type}`);
    });
  }

  return res.status(500).json({ message: err.message, pythonError: errData });
}
}
	  


// ✅ 2. Login + Send MFA OTP (Node.js → Python)
const loginUser = async (req, res) => {
  const { emailOrUsername, password } = req.body;

  try {
    console.log("📩 Incoming Login Request:", { emailOrUsername, now: new Date().toISOString() });

    // 1️⃣ Fetch user by email OR username from Python API
    const { data: user } = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/by-email?email=${emailOrUsername}`,
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    if (!user) return res.status(404).json({ message: "Invalid email or password" });

    console.log("👤 User found in Python:", {
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    // 2️⃣ Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔑 Password match result:", isMatch);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // 3️⃣ Block unverified users
    if (user.status !== "verified") {
      return res.status(403).json({ message: "Email not verified. Please verify OTP first." });
    }

    // 4️⃣ Generate MFA OTP
    const mfaOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const mfaOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    console.log("🔐 Generated MFA OTP:", { mfaOtp, mfaOtpExpiresAt });

    // 5️⃣ Update Python DB with MFA OTP
    await axios.patch(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${user._id}`,
      {
        mfaOtp,
        mfaOtpExpiresAt,
      },
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    // 6️⃣ Send OTP via email
    await sendEmail(user.email, "Your Login OTP Code", mfaOtp, user.email);

    // 7️⃣ Success response
    res.status(200).json({
      message: "OTP sent for login verification.",
      email: user.email,
      role: user.role,
      userId: user._id,
    });
  } catch (err) {
    console.error("Login error:", err.response?.data || err.message);
    res
      .status(500)
      .json({ message: err.message, pythonError: err.response?.data });
  }
};



// ✅ 3. Verify OTP (Signup or MFA)
const verifyOtp = async (req, res) => {
  const { email, otp, mode } = req.body;

  try {
    console.log("📩 Incoming Verify OTP Request:", {
      email,
      otp,
      mode,
      now: new Date().toISOString(),
    });

    // 1️⃣ Fetch user from Python API by email
    const { data: user } = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/by-email?email=${email}`,
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    console.log("🐍 Python API returned user:", user);

    if (!user) return res.status(404).json({ message: "User not found." });

    // 🔧 Safe datetime parser (Python + Node ISO)
    const parseExpiry = (dateStr) => {
      if (!dateStr) return null;

      let cleaned = dateStr.trim();

      if (cleaned.includes(".")) {
        cleaned = cleaned.replace(/(\.\d{3})\d+/, "$1");
      }

      cleaned = cleaned.replace(/Z+$/, "") + "Z";

      return new Date(cleaned);
    };

    // 2️⃣ MFA case
    if (mode === "login") {
      const expiry = parseExpiry(user.mfaOtpExpiresAt);

      console.log("👤 MFA OTP check:", {
        enteredOtp: otp,
        storedOtp: user.mfaOtp,
        storedExpiry: user.mfaOtpExpiresAt,
        parsedExpiry: expiry ? expiry.toISOString() : null,
        now: new Date().toISOString(),
      });

      if (
        String(user.mfaOtp) !== String(otp) ||
        !expiry ||
        expiry.getTime() < Date.now()
      ) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }

      await axios.patch(
        `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${user._id}`,
        { mfaOtp: null, mfaOtpExpiresAt: null },
        {
          headers: {
            "X-API-Key": process.env.API_KEY,
            "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
          },
        }
      );
    } else {
      // 3️⃣ Signup verification
      const expiry = parseExpiry(user.otpExpiresAt);

      console.log("👤 Signup OTP check:", {
        enteredOtp: otp,
        storedOtp: user.otp,
        storedExpiry: user.otpExpiresAt,
        parsedExpiry: expiry ? expiry.toISOString() : null,
        now: new Date().toISOString(),
        status: user.status,
      });

      if (user.status === "verified") {
        return res.status(400).json({ message: "Already verified." });
      }
      if (
        String(user.otp) !== String(otp) ||
        !expiry ||
        expiry.getTime() < Date.now()
      ) {
        console.warn("❌ Signup OTP mismatch or expired");
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }

      await axios.patch(
        `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${user._id}`,
        { status: "verified", otp: null, otpExpiresAt: null },
        {
          headers: {
            "X-API-Key": process.env.API_KEY,
            "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
          },
        }
      );
    }

    // 5️⃣ JWT & response
    const payload = {
      userId: user._id,
      role: user.role,
      effectiveUserId:
        user.role === "supporter" && user.referal_code
          ? user.referal_code
          : user._id,
    };
    if (user.role === "supporter") payload.referal_code = user.referal_code;

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      message: "OTP verified successfully.",
      token,
      userId: user._id,
      userName: user.user_name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });
  } catch (err) {
    console.error("Verify OTP error:", err.response?.data || err.message);
    res
      .status(500)
      .json({ message: err.message, pythonError: err.response?.data });
  }
};



// ✅ 4. Unified Resend OTP (Node.js → Python)
const resendOtp = async (req, res) => {
  const { email, mode } = req.body;

  try {
    console.log("📩 Incoming Resend OTP Request:", { email, mode, now: new Date().toISOString() });

    // 1️⃣ Fetch user from Python API
    const { data: user } = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/by-email?email=${email}`,
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    if (!user) return res.status(404).json({ message: "User not found." });

    // 2️⃣ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    console.log("🔑 Generated OTP:", { otp, otpExpires: otpExpires.toISOString() });

    // 3️⃣ Prepare update payload
    let updatePayload = {};
    if (mode === "login") {
      updatePayload = { mfaOtp: otp, mfaOtpExpiresAt: otpExpires };
    } else {
      if (user.status === "verified") {
        return res.status(400).json({ message: "User already verified." });
      }
      updatePayload = { otp: otp, otpExpiresAt: otpExpires };
    }

    // 4️⃣ Update Python DB
    await axios.patch(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${user._id}`,
      updatePayload,
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    // 5️⃣ Send email
    await sendEmail(email, "Your OTP Code", otp, email);

    console.log("✅ Resend OTP successful:", { email, mode, otp });

    return res.status(200).json({ message: "OTP resent." });
  } catch (err) {
    console.error("Resend OTP error:", err.response?.data || err.message);
    res
      .status(500)
      .json({ message: err.message, pythonError: err.response?.data });
  }
};


// ✅ 5. Unified Get OTP (Node.js → Python with safe parser)
const getOtpByEmail = async (req, res) => {
  const { email, mode } = req.query;

  try {
    console.log("📩 Incoming Get OTP Request:", { email, mode, now: new Date().toISOString() });

    // 1️⃣ Fetch user from Python API
    const { data: user } = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/by-email?email=${email}`,
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Pick correct OTP + expiry based on mode
    const otpField = mode === "login" ? user.mfaOtp : user.otp;
    const rawExpiry = mode === "login" ? user.mfaOtpExpiresAt : user.otpExpiresAt;

    // 🔧 Normalize Python datetime OR Node.js ISO datetime
    const parseExpiry = (dateStr) => {
      if (!dateStr) return null;

      let cleaned = dateStr.trim();

      // If Python microseconds (.869000) → reduce to 3 decimals
      if (cleaned.includes(".")) {
        cleaned = cleaned.replace(/(\.\d{3})\d+/, "$1");
      }

      // Ensure only ONE "Z"
      cleaned = cleaned.replace(/Z+$/, "") + "Z";

      return new Date(cleaned);
    };

    const expiry = parseExpiry(rawExpiry);

    console.log("👤 OTP fetch check:", {
      enteredMode: mode,
      otp: otpField,
      rawExpiry,
      parsedExpiry: expiry ? expiry.toISOString() : null,
      now: new Date().toISOString(),
    });

    // 3️⃣ Validate existence + expiry
    if (!otpField || !expiry || expiry.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired or missing" });
    }

    // 4️⃣ Return OTP
    return res.status(200).json({ otp: otpField });
  } catch (err) {
    console.error("Get OTP error:", err.response?.data || err.message);
    res
      .status(500)
      .json({ message: err.message, pythonError: err.response?.data });
  }
};
// ✅ Forgot Password (Node.js → Python)
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 1️⃣ Fetch user from Python by email
    const { data: user } = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/by-email?email=${email}`,
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Generate reset token (JWT)
    const resetToken = jwt.sign(
      { user_id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // 3️⃣ Send email
    await sendResetEmail(user.email, user.user_name, resetLink);

    return res.json({ message: "Reset link sent to email." });
  } catch (err) {
    console.error("Forgot password error:", err.response?.data || err.message);
    return res
      .status(500)
      .json({ message: err.message, pythonError: err.response?.data });
  }
};


// ✅ Reset Password (Node.js → Python)
const resetPassword = async (req, res) => {
  const { token } = req.query;
  const { password, confirmPassword } = req.body;

  if (!token) return res.status(400).json({ message: "Token is required" });
  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be 8+ chars, with uppercase, lowercase, and number.",
    });
  }

  try {
    // 1️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2️⃣ Check if user exists in Python
    const { data: user } = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/by-email?email=${decoded.email}`,
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    if (!user || user._id !== decoded.user_id) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    // 3️⃣ Hash password (do it in Node before sending to Python)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4️⃣ Update password in Python DB
    await axios.patch(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${user._id}`,
      { password: hashedPassword },
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    return res.json({ message: "Password reset successful." });
  } catch (err) {
    console.error("Reset password error:", err.response?.data || err.message);
    return res
      .status(400)
      .json({ message: "Invalid or expired token.", pythonError: err.response?.data });
  }
};

// ✅ Google OAuth Callback (Node.js → Python)
const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(400)
        .send({ error: "Authentication failed. No user found." });
    }

    const user = req.user;

    // 1️⃣ Mark user as verified in Python if not already
    if (user.status !== "verified") {
      await axios.patch(
        `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${user._id}`,
        { status: "verified" },
        {
          headers: {
            "X-API-Key": process.env.API_KEY,
            "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
          },
        }
      );
    }

    // 2️⃣ JWT payload
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
      expiresIn: "1d",
    });

    // 3️⃣ Redirect based on new user
    const isNewUser = req.isNewUser;
    const redirectPath = isNewUser
      ? `${process.env.FRONTEND_URL}/welcome/?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`
      : `${process.env.FRONTEND_URL}/calendar?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`;

    return res.redirect(redirectPath);
  } catch (error) {
    console.error("Error in googleCallback:", error.response?.data || error.message);
    res.status(500).send({
      error: error.message,
      pythonError: error.response?.data,
      stack: error.stack,
    });
  }
};

// ✅ Facebook OAuth Callback (Node.js → Python)
const facebookCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(400)
        .send({ error: "Authentication failed. No user found." });
    }

    const user = req.user;

    // 1️⃣ Mark user as verified in Python if not already
    if (user.status !== "verified") {
      await axios.patch(
        `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${user._id}`,
        { status: "verified" },
        {
          headers: {
            "X-API-Key": process.env.API_KEY,
            "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
          },
        }
      );
    }

    // 2️⃣ JWT payload
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
      expiresIn: "1d",
    });

    // 3️⃣ Redirect based on new user
    const isNewUser = req.isNewUser;
    const redirectPath = isNewUser
      ? `${process.env.FRONTEND_URL}/welcome/?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`
      : `${process.env.FRONTEND_URL}/calendar?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`;

    return res.redirect(redirectPath);
  } catch (error) {
    console.error("Error in facebookCallback:", error.response?.data || error.message);
    res.status(500).send({
      error: error.message,
      pythonError: error.response?.data,
      stack: error.stack,
    });
  }
};



// //google oath
// const googleCallback = async (req, res) => {
// 	try {
// 		if (!req.user) {
// 			return res.status(400).send({ error: "Authentication failed. No user found." });
// 		}
// 		const user = req.user;
//      // ✅ Mark user as verified if not already
//     if (user.status !== "verified") {
//       user.status = "verified";
//       await user.save();
//     }
// 		const token = jwt.sign(
// 			{ userId: user._id, email: user.email, user_name: user.user_name, role: user.role, permissions: user.permissions },
// 			process.env.JWT_SECRET,
// 			{ expiresIn: '1d' }
// 		);
//     // ✅ Use req.isNewUser from strategy
//     const isNewUser = req.isNewUser;

//     const redirectPath = isNewUser
//       ? `${process.env.FRONTEND_URL}/welcome/?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`
//       : `${process.env.FRONTEND_URL}/calendar?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`;
//     return res.redirect(redirectPath);
// 		//res.redirect(`${process.env.FRONTEND_URL}/welcome/?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`);
// 	} catch (error) {
// 		console.error("Error in googleCallback:", error);
//     res.status(500).send({ error: error.message, stack: error.stack });
// 		// res.status(500).send({ error: "Internal server error..." });
// 	}
// };
// //fb oath
// const facebookCallback = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(400).send({ error: "Authentication failed. No user found." });
//     }
//     const mode = req.query.state;
//     const user = req.user;
//       // ✅ Mark user as verified if not already
//     if (user.status !== "verified") {
//       user.status = "verified";
//       await user.save();
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
    
//    const isNewUser = req.isNewUser;

//     const redirectPath = isNewUser
//       ? `${process.env.FRONTEND_URL}/welcome/?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`
//       : `${process.env.FRONTEND_URL}/calendar?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`;
//      return res.redirect(redirectPath); 
//    // res.redirect(`${process.env.FRONTEND_URL}?token=${token}&userId=${user._id}&userName=${user.user_name}&role=${user.role}&permissions=${user.permissions}&email=${user.email}`);
//   } catch (error) {
//     console.error("Error in facebookCallback:", error);
//     res.status(500).send({ error: error.message, stack: error.stack });
//     // res.status(500).send({ error: "Internal server error..." });
//   }
// };

//supporters
const referSupporter = async (req, res) => {
  try {
    const referals = req.body;

    if (!Array.isArray(referals) || referals.length === 0) {
      return res.status(400).send({ error: "An array of referals is required." });
    }

    // Fetch user from Python DB
    const { data: user } = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${req.user.userId}`,
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );
    if (!user) return res.status(404).send({ error: "User not found." });

    const updatedReferals = [...(user.referals || [])];
    const newReferals = [];
    const emailsToResend = [];

    for (const ref of referals) {
      const { referal_email, permissions, role, relation, first_name, last_name } = ref;
      if (!referal_email || !permissions || !role) {
        return res.status(400).send({
          error: "Each referal must include referal_email, permissions, and role.",
        });
      }

      const existingReferral = updatedReferals.find(r => r.referal_email === referal_email);

      if (existingReferral) {
        if (existingReferral.status === "accepted") continue;

        existingReferral.resentCount = (existingReferral.resentCount || 0) + 1;
        emailsToResend.push(existingReferral);
      } else {
        const newRef = {
          referal_email,
          permissions,
          role,
          relation: relation || "",
          first_name: first_name || "",
          last_name: last_name || "",
          referal_code: req.user.userId,
          status: "pending",
          sentAt: new Date().toISOString(),
          resentCount: 0,
        };
        updatedReferals.push(newRef);
        newReferals.push(newRef);
      }
    }

    // Save in Python DB
    await axios.patch(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${req.user.userId}`,
      { referals: updatedReferals },
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    // Send emails
    const referralName = req.user.user_name;
    const referal_code = req.user.userId;
    const allToSend = [...newReferals, ...emailsToResend];
    if (allToSend.length > 0) {
      await sendReferralEmail(allToSend, referralName, referal_code);
    }

    return res.status(200).json({
      message: "Referrals processed successfully",
      newReferals,
      resent: emailsToResend,
    });
  } catch (error) {
    console.error("Error in referSupporter:", error.response?.data || error.message);
    res.status(500).send({ error: "Internal server error." });
  }
};

// ---------------------
// 2️⃣ Get Referrals
// ---------------------
const getReferals = async (req, res) => {
  try {
    const { data: user } = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${req.user.userId}`,
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ referals: user.referals || [] });
  } catch (error) {
    console.error("Error fetching referals:", error.response?.data || error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ---------------------
// 3️⃣ Edit Referral
// ---------------------
const editReferal = async (req, res) => {
  try {
    const { referal_email, permissions, relation, first_name, last_name } = req.body;

    // Fetch user
    const { data: mom } = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${req.user.userId}`,
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );
    if (!mom) return res.status(404).send({ error: "Mom not found" });

    const referals = [...(mom.referals || [])];
    const referal = referals.find(r => r.referal_email === referal_email);
    if (!referal) return res.status(404).send({ error: "Referral not found" });

    if (permissions) referal.permissions = permissions;
    if (relation !== undefined) referal.relation = relation;
    if (first_name !== undefined) referal.first_name = first_name;
    if (last_name !== undefined) referal.last_name = last_name;

    // Save back to Python
    await axios.patch(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${req.user.userId}`,
      { referals },
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    return res.status(200).send({ message: "Referral updated successfully", referal });
  } catch (err) {
    console.error("Error in editReferal:", err.response?.data || err.message);
    res.status(500).send({ error: "Internal server error" });
  }
};

// ---------------------
// 4️⃣ Delete Referral
// ---------------------
const deleteReferal = async (req, res) => {
  try {
    const { referal_email } = req.body;

    // Fetch mom user
    const { data: mom } = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${req.user.userId}`,
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );
    if (!mom) return res.status(404).send({ error: "Mom not found" });

    const referals = [...(mom.referals || [])];
    const referalIndex = referals.findIndex(r => r.referal_email === referal_email);
    if (referalIndex === -1) return res.status(404).send({ error: "Referral not found" });

    referals.splice(referalIndex, 1);

    // Save back to Python DB
    await axios.patch(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user?user_id=${req.user.userId}`,
      { referals },
      {
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    return res.status(200).send({ message: "Referral deleted successfully" });
  } catch (err) {
    console.error("Error in deleteReferal:", err.response?.data || err.message);
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

