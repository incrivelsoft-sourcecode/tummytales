const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require("axios");
const UserDetails = require('../model/User.js');
const crypto = require("crypto");
const sendReferralEmail = require("../utils/sendReferralEmail.js");
const {SupporterProfile} = require("../model/profile.js");


// Create profile
const createSupporterProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Supporter's own ID

    const {
      first_name,
      last_name,
      dob,
      gender,
      nationality,
      Phonenumber,
      email,
      country,
      Addressline1,
      Addressline2,
      city,
      State,
      Zip_code,
    } = req.body;

    const requiredFields = {
      first_name,
      last_name,
      dob,
      gender,
      nationality,
      Phonenumber,
      email,
      country,
      Addressline1,
      city,
      State,
      Zip_code,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || value === "")
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
    }

     // Build clean payload for Python
    const supporterPayload = {
      userId,
      first_name,
      last_name,
      dob,
      gender,
      nationality,
      Phonenumber,
      email,
      country,
      Addressline1,
      Addressline2,
      city,
      State,
      Zip_code,
    };

    // Send to Python API
    const response = await axios.post(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/supporter`,
      supporterPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    return res.status(201).json({
      message: "Supporter profile created successfully via Python API!",
      pythonResponse: response.data,
    });
  } catch (error) {
    console.error("Failed to create supporter profile:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to create supporter profile",
      details: error.response?.data,
    });
  }
};

// Get profile by ID (used for editing or viewing a single profile)
const getSupporterProfile = async (req, res) => {
  try {
    //const { id } = req.params;
    const userId = req.user.id;

   const response = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/supporter`,
      {
        params: { user_id: userId },
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    if (!response.data) {
      return res.status(404).json({ error: "Supporter profile not found" });
    }

    return res.status(200).json({
      message: "Supporter profile retrieved",
      profile: response.data,
    });
  } catch (error) {
    console.error("Failed to retrieve supporter profile:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to retrieve supporter profile" });
  }
};
// Get all supporter profiles (for admin or future use)
const getAllSupporterProfiles = async (req, res) => {
  try {
    const userId = req.user.id;

    const profiles = await SupporterProfile.find({ userId });

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({ message: "No profiles found for this user" });
    }

    return res.status(200).json({ success: true, profiles });
  } catch (error) {
    console.error("Failed to get supporter profiles:", error);
    return res.status(500).json({ error: "Failed to retrieve profiles" });
  }
};

// Update profile
const updateSupporterProfile = async (req, res) => {
  try {
   // const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
 // Check existing profile in Python DB
    const existingResp = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/supporter`,
      {
        params: { user_id: userId },
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    const existingProfile = existingResp.data;
    if (!existingProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Call Python PATCH API
    const patchResp = await axios.patch(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/supporter`,
      updates,
      {
        params: { user_id: userId },
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    return res.status(200).json({
      message: "Supporter profile updated successfully",
      profile: patchResp.data.survey,
    });
  } catch (error) {
    console.error("Failed to update supporter profile:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to update supporter profile" });
  }
};

// Delete profile
const deleteSupporterProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const response = await axios.delete(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/supporter`,
      {
        params: { user_id: userId },
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );

    return res.status(200).json({
      message: "Supporter profile deleted successfully",
      result: response.data,
    });
  } catch (error) {
    console.error("Failed to delete supporter profile:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to delete supporter profile" });
  }
};



module.exports = {
     createSupporterProfile,
  getSupporterProfile,
  getAllSupporterProfiles,
  updateSupporterProfile,
  deleteSupporterProfile}


