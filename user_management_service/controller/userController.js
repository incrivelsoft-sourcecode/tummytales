const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/User.js');
//const redisClient = require("../config/redisClient");



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
		await Analytics.findOneAndDelete({ user: req.params.id });
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
  



module.exports = { googleCallback, deleteUser, updatePassword, getUser, getAllUsers, loginUser, createUser }
