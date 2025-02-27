const express = require('express');
const {momAndSupporterMiddleware} = require('../middleware/authMiddleware.js');
const { googleCallback, deleteUser, updatePassword, getUser, getAllUsers, loginUser, createUser, checkUsernameAvailability} = require('../controller/userController.js');
const passport = require("passport");

const router = express.Router();

router.post('/register-user', createUser);
router.post('/login', loginUser);

router.get("/check/username", checkUsernameAvailability);

router.get("/google", (req, res, next) => {
    const { user_name, role, referral_code, permissions = [] } = req.query;
  
    // Validate role before redirecting
    if (!role || !["mom", "supporter"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'mom' or 'supporter'." });
    }
  
    // Encode user details in the state parameter
    const state = JSON.stringify({ user_name, role, referral_code, permissions });
  
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: encodeURIComponent(state), // ✅ Pass state to Google
    })(req, res, next);
  });
  
router.get("/google/callback", passport.authenticate("google", {failureRedirect: "/google"}), googleCallback);

router.get('/', momAndSupporterMiddleware, getUser);




module.exports = router;
