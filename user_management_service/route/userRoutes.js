const express = require('express');
const {momAndSupporterMiddleware, momMiddleware} = require('../middleware/authMiddleware.js');
const { googleCallback, deleteUser, updatePassword, getUser, getAllUsers, loginUser, createUser, checkUsernameAvailability, referSupporter, getReferedSupporters, editPermissionOfSuppoter, deleteSupporter} = require('../controller/userController.js');
const passport = require("passport");

const router = express.Router();

router.post('/register-user', createUser);
router.post('/login', loginUser);

//router.get("/check/username", checkUsernameAvailability);

router.get("/google", (req, res, next) => {
    const { user_name, role, referal_code, permissions = [] } = req.query;
  
    // Encode user details in the state parameter
    const state = JSON.stringify({ user_name, role, referal_code, permissions });
  
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: encodeURIComponent(state), // ✅ Pass state to Google
    })(req, res, next);
  });
  
router.get("/google/callback", passport.authenticate("google", {failureRedirect: "/google"}), googleCallback);

router.get('/', momAndSupporterMiddleware, getUser);
router.post("/send-referels", momMiddleware, referSupporter);
router.get("/supporters", momMiddleware, getReferedSupporters)
router.put("/supporter/:id", momMiddleware, editPermissionOfSuppoter);
router.delete("/supporter/:id", momMiddleware, deleteSupporter);




module.exports = router;
