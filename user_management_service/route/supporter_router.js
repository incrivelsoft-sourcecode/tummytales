const express = require('express');
const {momAndSupporterMiddleware, momMiddleware} = require('../middleware/authMiddleware.js');
const { referSupporter,
  getReferals, deleteReferal,editReferal,
  createSupporterProfile,
  getSupporterProfileById,
  getAllSupporterProfiles,
  updateSupporterProfile,
  deleteSupporterProfile
 } = require('../controller/support_controller.js');

const passport = require("passport");

const router = express.Router();

//supporter apis
router.post("/send-referels", momMiddleware, referSupporter);
router.get("/referals", momMiddleware, getReferals);
router.put("/edit-referals",momMiddleware,editReferal);
router.delete("/deletereferals",momMiddleware,deleteReferal);

// All routes are protected supporter profile
router.post('/profile', momAndSupporterMiddleware, createSupporterProfile);
router.get('/profile/:id', momAndSupporterMiddleware, getSupporterProfileById);
router.get('/profiles', momAndSupporterMiddleware, getAllSupporterProfiles);
router.put('/profile/:id', momAndSupporterMiddleware, updateSupporterProfile);
router.delete('/profile/:id', momAndSupporterMiddleware, deleteSupporterProfile);

module.exports = router;
