const express = require('express');
const {momAndSupporterMiddleware, momMiddleware} = require('../middleware/authMiddleware.js');
const { googleCallback,facebookCallback,resendOtp,verifyOtp ,getOtpByEmail,deleteAllUsers, 
  getUser, getAllUsers, loginUser, createUser, referSupporter,
  getReferals,resetPassword,forgotPassword, deleteReferal,editReferal, getallusers,
 } = require('../controller/userController.js');
const passport = require("passport");

const router = express.Router();

router.post('/register-user', createUser);
router.post("/verify-otp",verifyOtp );
router.get('/get-latest-otp', getOtpByEmail);
router.post("/resend-otp", resendOtp);
router.post('/login', loginUser);
router.get("/all",getallusers)
router.delete('/all',deleteAllUsers)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/google", (req, res, next) => {
    const { user_name, role, referal_code, permissions = [] } = req.query;
  
    // Encode user details in the state parameter
    const state = JSON.stringify({ user_name, role, referal_code, permissions });
  
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: 'select_account',
      state: encodeURIComponent(state), // ✅ Pass state to Google
    })(req, res, next);
  }); 
router.get("/google/callback", passport.authenticate("google", {failureRedirect: "/google"}), googleCallback);

// GET /users/facebook
router.get("/facebook", (req, res, next) => {
  const { user_name, role, referal_code, permissions = [] } = req.query;

  // Encode user details in the state parameter
  const state = JSON.stringify({ user_name, role, referal_code, permissions });

  passport.authenticate("facebook", {
    scope: ["email"],
    prompt: 'select_account',
     state,
    //state: encodeURIComponent(state),
  })(req, res, next);
});

// GET /users/facebook/callback
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/facebook" }),
  facebookCallback
);


//supporter apis
router.post("/send-referels", momMiddleware, referSupporter);
router.get("/referals", momMiddleware, getReferals);
router.put("/edit-referals",momMiddleware,editReferal);
router.delete("/deletereferals",momMiddleware,deleteReferal);


module.exports = router;
