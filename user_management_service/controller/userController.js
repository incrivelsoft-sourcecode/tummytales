const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require("axios");
const User = require('../model/User.js');
const UserDetails = require('../model/User.js');
//const redisClient = require("../config/redisClient");
const sendEmail = require("../utils/sendEmail.js"); // Create this helper
const crypto = require("crypto");
const sendReferralEmail = require("../utils/sendReferralEmail.js");

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
  
	  // Validate required fields
	  const requiredFields = { user_name, email, password, ...(role === "supporter" && { referal_code, permissions }) };
	  const missingFields = Object.entries(requiredFields)
		.filter(([_, value]) => !value)
		.map(([key]) => key);
  
	  if (missingFields.length > 0) {
		return res.status(400).json({ message: `Missing fields: ${missingFields.join(", ")}` });
	  }
  
	  // Validate referal code
	  if (role === "supporter") {
		const existingMom = await User.findById(referal_code);
		if (!existingMom) {
		  return res.status(404).json({ message: `Invalid referral code: ${referal_code}` });
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


  const verifyOtp = async (req, res) => {
	try {
	  const { email, otp } = req.body;
  
	  if (!email || !otp) {
		return res.status(400).json({ message: "Email and OTP are required." });
	  }
  
	  const user = await User.findOne({ email });
  
	  if (!user) {
		return res.status(404).json({ message: "User not found." });
	  }
  
	  if (user.status === "verified") {
		return res.status(400).json({ message: "User is already verified." });
	  }
  
	  if (user.otp !== otp) {
		return res.status(400).json({ message: "Invalid OTP." });
	  }
  
	  if (user.otpExpiresAt < new Date()) {
		return res.status(400).json({ message: "OTP has expired." });
	  }
  
	  // Mark user as verified
	  user.status = "verified";
	  user.otp = undefined;
	  user.otpExpiresAt = undefined;
	  await user.save();
  
	  // Optionally issue a token now
	  const token = jwt.sign(
		{ userId: user._id, role: user.role },
		process.env.JWT_SECRET || "your_secret_key",
		{ expiresIn: "1h" }
	  );
  
	  return res.status(200).json({
		message: "Email verified successfully. You can proceed with your profile now.",
		token,
		userId: user._id,
		userName: user.user_name,
		email: user.email,
		role: user.role,
		permissions: user.permissions
	  });
  
	} catch (err) {
	  return res.status(500).json({ message: err.message });
	}
  };
  

const getOtpByEmail = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.status === "verified") {
    return res.status(400).json({ message: "User is already verified" });
  }

  if (user.otpExpiresAt < new Date()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  return res.status(200).json({ otp: user.otp });
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.status === "verified") {
      return res.status(400).json({ message: "User is already verified." });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.otp = newOtp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Send new OTP to email
    await sendEmail(email, `Your New OTP Code`, newOtp, email);

    return res.status(200).json({ message: "New OTP sent to your email." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};



const loginUser = async (req, res) => {
	const { emailOrUsername, password } = req.body;

	try {
		const user = await User.findOne({ $or: [{ email: emailOrUsername }, { user_name: emailOrUsername }] });

		if (!user) {
			return res.status(404).json({ message: 'Invalid email or password' });
		}

		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			return res.status(400).json({ message: 'Invalid email or password' });
		}

		const token = jwt.sign(
			{ userId: user._id, email: user.email, user_name: user.user_name, role: user.role, permissions: user.permissions },
			process.env.JWT_SECRET,
			{ expiresIn: '1d' }
		);

		res.json({ message: "Login successfull", token, userId: user._id, userName: user.user_name, email: user.email, role: user.role, permissions: user.permissions });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// Get all users
const getAllUsers = async (req, res) => {
	try {
		const { page = 1, limit = 10 } = req.query;
		const skip = (page - 1) * limit;
		const users = await User.find().select('-password').skip(skip).limit(limit);
		const totalUsers = await User.countDocuments();

		res.status(200).send({ totalPages: Math.ceil(totalUsers / limit), currentPage: page, users });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};


// Get a user by ID
const getUser = async (req, res) => {
	try {
		const user = await User.findById(req.user?.userId).select('-password');
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.json(user);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

// Update a user
const updateUser = async (req, res) => {
	const { first_name, last_name, email } = req.body;

	try {
		const updatedUser = await User.findByIdAndUpdate(
			req.user?.userId,
			{ first_name, last_name, email },
			{ new: true }
		).select('-password');
		if (!updatedUser) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.json(updatedUser);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

// UPDATE USER PASSWORD
const updatePassword = async (req, res) => {
	const { newPassword } = req.body;

	try {
		const user = await User.findById(req.user?.userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		user.password = newPassword;
		await user.save();

		res.json({ message: "Password updated successfully" });
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
};

// Delete a user
const deleteUser = async (req, res) => {
	try {
		const deletedUser = await User.findByIdAndDelete(req.params.id);
		if (!deletedUser) {
			return res.status(404).json({ message: 'User not found' });
		}
		
		res.json({ message: 'User deleted successfully' });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

const googleCallback = async (req, res) => {
	try {
		if (!req.user) {
			return res.status(400).send({ error: "Authentication failed. No user found." });
		}

		const user = req.user;
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







const getReferedSupporters = async (req, res) => {
	try {
		const referal_code = req.user.userId;
		const referedSupporters = await UserDetails.find({ referal_code }).select("_id user_name email permissions referal_code");
		res.status(200).send({ referedSupporters });
	} catch (error) {
		console.error("Error in getReferedSupporters:", error);
		res.status(500).send({ error: "Internal server error." });
	}
}

const editPermissionOfSuppoter = async(req, res) => {
    try {
        const { permissions } = req.body;
        const {id} = req.params;
        
        // Fixed validation - should check if permissions exists AND has length > 0
        if(!permissions || !(permissions.length > 0))
        {
            return res.status(400).send({error: "permission is required..."});
        }
        
        const updateSupporter = await UserDetails.findByIdAndUpdate(id, {permissions}, {new: true, runValidators: true});
        if(!updateSupporter)
        {
            return res.status(404).send({error: `Supporter not found with id: ${id}`});
        }
        res.status(200).send({message: "Supporter permissions have updated...", updatedSupporter: updateSupporter});
    } catch (error) {
        console.error("Error in editPermissionOfSuppoter:", error);
        res.status(500).send({ error: "Internal server error." });
    }
}

const deleteSupporter = async(req, res) => {
	try {
		const {id} = req.params;
		const deleteSuppoter = await UserDetails.findOneAndDelete(id);
		if(!deleteSuppoter)
		{
			return res.status(404).send({error: `Supporter not found with id: ${id}`});
		}
		res.status(200).send({message: "Requested, supporter have deleted.."})
	} catch (error) {
		console.error("Error in deleteSupporter:", error);
		res.status(500).send({ error: "Internal server error." });
	}
}



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



module.exports = {verifyOtp,getOtpByEmail, resendOtp , googleCallback,deleteAllUsers, deleteUser, getallusers,updatePassword, getUser, getAllUsers, loginUser, createUser,
	 referSupporter,getReferals,editReferal,deleteReferal, getReferedSupporters, editPermissionOfSuppoter, deleteSupporter }








// const createUser = async (req, res) => {
// 	try {
// 		const { user_name, email, password, confirm_password, role, referal_code, permissions = [] } = req.body;

// 		// Validate role
// 		if (!["mom", "supporter"].includes(role)) {
// 			return res.status(400).json({ message: "Invalid role. Must be 'mom' or 'supporter'." });
// 		}

// 		// Check if user already exists (single DB query)
// 		const existingUser = await User.findOne({ $or: [{ email }, { user_name }] });
// 		if (existingUser) {
// 			return res.status(400).json({ message: "Email or username already in use." });
// 		}

// 		// Validate passwords
// 		if (confirm_password !== password) {
// 			return res.status(400).json({ message: "Passwords do not match." });
// 		}

// 		// Validate required fields dynamically
// 		const requiredFields = { user_name, email, password, ...(role === "supporter" && { referal_code, permissions }) };
// 		const missingFields = Object.entries(requiredFields)
// 			.filter(([_, value]) => !value)
// 			.map(([key]) => key);

// 		if (missingFields.length > 0) {
// 			return res.status(400).json({ message: `Missing fields: ${missingFields.join(", ")}` });
// 		}

// 		// If role is "supporter", validate referal_code
// 		if (role === "supporter") {
// 			const existingMom = await User.findById(referal_code);
// 			if (!existingMom) {
// 				return res.status(404).json({ message: `Invalid referral code: ${referal_code}` });
// 			}
// 		}

// 		// Create new user
// 		const user = new User({ user_name, email, password, role, referal_code: role === "supporter" ? referal_code : null, permissions });

// 		// Save user
// 		await user.save();

// 		const token = jwt.sign(
// 			{ userId: user._id, role: user.role },
// 			process.env.JWT_SECRET || "your_secret_key", // Replace with environment variable
// 			{ expiresIn: "1h" } // Token expires in 1 hour
// 		);
// 		res.status(201).json({ message: "User created successfully!", token, userId: user._id, userName: user.user_name, email: user.email, role: user.role, permissions: user.permissions });
// 	} catch (err) {
// 		res.status(500).json({ message: err.message });
// 	}
// };














// const checkUsernameAvailability = async (req, res) => {
// 	const { user_name } = req.query;

// 	if (!user_name || user_name.length < 3) {
// 	  return res.status(400).json({ message: "Invalid username" });
// 	}

// 	try {
// 	  // ✅ Use `await` instead of callback-based `get`
// 	  const cachedUsername = await redisClient.get(`username:${user_name}`);

// 	  if (cachedUsername !== null) {
// 		return res.status(200).json({ available: false, message: "Username already taken" });
// 	  }

// 	  // If not in Redis, check MongoDB
// 	  const existingUser = await User.findOne({ user_name });

// 	  if (existingUser) {
// 		await redisClient.set(`username:${user_name}`, "true", { EX: 3600 }); // Store in Redis for 1 hour
// 		return res.status(200).json({ available: false, message: "Username already taken" });
// 	  }

// 	  res.status(200).json({ available: true, message: "Username available" });
// 	} catch (err) {
// 	  console.log("❌ Error in checkUsernameAvailability:", err);
// 	  res.status(500).json({ message: "Server error" });
// 	}
//   };




/*main tom

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
  
	  // Validate required fields
	  const requiredFields = { user_name, email, password, ...(role === "supporter" && { referal_code, permissions }) };
	  const missingFields = Object.entries(requiredFields)
		.filter(([_, value]) => !value)
		.map(([key]) => key);
  
	  if (missingFields.length > 0) {
		return res.status(400).json({ message: `Missing fields: ${missingFields.join(", ")}` });
	  }
  
	  // Validate referal code
	  if (role === "supporter") {
		const existingMom = await User.findById(referal_code);
		if (!existingMom) {
		  return res.status(404).json({ message: `Invalid referral code: ${referal_code}` });
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
	  await sendEmail(email, `Your OTP Code`, `Your OTP for verification is: ${otp}`);
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


  const verifyOtp = async (req, res) => {
	try {
	  const { email, otp } = req.body;
  
	  if (!email || !otp) {
		return res.status(400).json({ message: "Email and OTP are required." });
	  }
  
	  const user = await User.findOne({ email });
  
	  if (!user) {
		return res.status(404).json({ message: "User not found." });
	  }
  
	  if (user.status === "verified") {
		return res.status(400).json({ message: "User is already verified." });
	  }
  
	  if (user.otp !== otp) {
		return res.status(400).json({ message: "Invalid OTP." });
	  }
  
	  if (user.otpExpiresAt < new Date()) {
		return res.status(400).json({ message: "OTP has expired." });
	  }
  
	  // Mark user as verified
	  user.status = "verified";
	  user.otp = undefined;
	  user.otpExpiresAt = undefined;
	  await user.save();
  
	  // Optionally issue a token now
	  const token = jwt.sign(
		{ userId: user._id, role: user.role },
		process.env.JWT_SECRET || "your_secret_key",
		{ expiresIn: "1h" }
	  );
  
	  return res.status(200).json({
		message: "Email verified successfully. You can proceed with your profile now.",
		token,
		userId: user._id,
		userName: user.user_name,
		email: user.email,
		role: user.role,
		permissions: user.permissions
	  });
  
	} catch (err) {
	  return res.status(500).json({ message: err.message });
	}
  };
  
  */


  /*old create user without otp 
  const createUser = async (req, res) => {
	try {
		const { user_name, email, password, confirm_password, role, referal_code, permissions = [] } = req.body;

		// Validate role
		if (!["mom", "supporter"].includes(role)) {
			return res.status(400).json({ message: "Invalid role. Must be 'mom' or 'supporter'." });
		}

		// Check if user already exists (single DB query)
		const existingUser = await User.findOne({ $or: [{ email }, { user_name }] });
		if (existingUser) {
			return res.status(400).json({ message: "Email or username already in use." });
		}

		// Validate passwords
		if (confirm_password !== password) {
			return res.status(400).json({ message: "Passwords do not match." });
		}

		// Validate required fields dynamically
		const requiredFields = { user_name, email, password, ...(role === "supporter" && { referal_code, permissions }) };
		const missingFields = Object.entries(requiredFields)
			.filter(([_, value]) => !value)
			.map(([key]) => key);

		if (missingFields.length > 0) {
			return res.status(400).json({ message: `Missing fields: ${missingFields.join(", ")}` });
		}

		// If role is "supporter", validate referal_code
		if (role === "supporter") {
			const existingMom = await User.findById(referal_code);
			if (!existingMom) {
				return res.status(404).json({ message: `Invalid referral code: ${referal_code}` });
			}
		}

		// Create new user
		const user = new User({ user_name, email, password, role, referal_code: role === "supporter" ? referal_code : null, permissions });

		// Save user
		await user.save();

		const token = jwt.sign(
			{ userId: user._id, role: user.role },
			process.env.JWT_SECRET || "your_secret_key", // Replace with environment variable
			{ expiresIn: "1h" } // Token expires in 1 hour
		);
		res.status(201).json({ message: "User created successfully!", token, userId: user._id, userName: user.user_name, email: user.email, role: user.role, permissions: user.permissions });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};*/
