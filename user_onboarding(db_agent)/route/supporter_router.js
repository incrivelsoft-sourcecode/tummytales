const express = require('express');
const {momAndSupporterMiddleware, momMiddleware} = require('../middleware/authMiddleware.js');
const {
  createSupporterProfile,
  getSupporterProfile,
  getAllSupporterProfiles,
  updateSupporterProfile,
  deleteSupporterProfile
 } = require('../controller/support_controller.js');

const passport = require("passport");

const router = express.Router();

// All routes are protected supporter profile
router.post('/profile', momAndSupporterMiddleware, createSupporterProfile);
router.get('/profile', momAndSupporterMiddleware, getSupporterProfile);
router.get('/profiles', momAndSupporterMiddleware, getAllSupporterProfiles);
router.put('/profile', momAndSupporterMiddleware, updateSupporterProfile);
router.delete('/profile', momAndSupporterMiddleware, deleteSupporterProfile);

module.exports = router;
