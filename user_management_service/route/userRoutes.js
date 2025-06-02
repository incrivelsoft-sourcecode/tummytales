const express = require('express');
const {momAndSupporterMiddleware, momMiddleware} = require('../middleware/authMiddleware.js');
const { googleCallback,facebookCallback, deleteUser, resendOtp,verifyOtp ,getOtpByEmail,updatePassword,deleteAllUsers, 
  getUser, getAllUsers, loginUser, createUser, checkUsernameAvailability, referSupporter,
  getReferals, deleteReferal,editReferal,
  getReferedSupporters, editPermissionOfSuppoter, deleteSupporter, getallusers,
 } = require('../controller/userController.js');
const passport = require("passport");

const router = express.Router();

router.post('/register-user', createUser);
router.post("/verify-otp",verifyOtp );
router.get('/get-latest-otp', getOtpByEmail);
router.post("/resend-otp", resendOtp);
router.post('/login', loginUser);
router.delete("/userdel/:id",deleteUser);
router.get("/all",getallusers)
router.delete('/all',deleteAllUsers)

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

// GET /users/facebook
router.get("/facebook", (req, res, next) => {
  const { user_name, role, referal_code, permissions = [] } = req.query;

  // Encode user details in the state parameter
  const state = JSON.stringify({ user_name, role, referal_code, permissions });

  passport.authenticate("facebook", {
    scope: ["email"],
    state: encodeURIComponent(state),
  })(req, res, next);
});

// GET /users/facebook/callback
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/facebook" }),
  facebookCallback
);


router.get('/', momAndSupporterMiddleware, getUser);
//supporter apis
router.post("/send-referels", momMiddleware, referSupporter);
router.get("/referals", momMiddleware, getReferals);
router.put("/edit-referals",momMiddleware,editReferal);
router.delete("/deletereferals",momMiddleware,deleteReferal);
router.get("/supporters", momMiddleware, getReferedSupporters)
router.put("/supporter/:id", momMiddleware, editPermissionOfSuppoter);
router.delete("/supporter/:id", momMiddleware, deleteSupporter);




module.exports = router;
