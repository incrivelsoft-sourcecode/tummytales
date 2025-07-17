const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require("axios");
const UserDetails = require('../model/User.js');
const crypto = require("crypto");
const sendReferralEmail = require("../utils/sendReferralEmail.js");
const {SupporterProfile} = require("../model/profile.js");


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

    const profile = new SupporterProfile({
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
    });
await profile.save();
    return res.status(201).json({ message: "Supporter profile created", profile });
  } catch (error) {
    console.error("Failed to create supporter profile:", error);
    return res.status(500).json({ error: "Failed to create profile" });
  }
};

// Get profile by ID (used for editing or viewing a single profile)
const getSupporterProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const profile = await SupporterProfile.findOne({ _id: id, userId });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.status(200).json({ message: "Profile retrieved", profile });
  } catch (error) {
    console.error("Failed to retrieve supporter profile:", error);
    return res.status(500).json({ error: "Failed to retrieve profile" });
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
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    const existingProfile = await SupporterProfile.findOne({ _id: id });

    if (!existingProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (existingProfile.userId.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized to update this profile" });
    }

    const updatedProfile = await SupporterProfile.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

// Delete profile
const deleteSupporterProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingProfile = await SupporterProfile.findOne({ _id: id });

    if (!existingProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (existingProfile.userId.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete this profile" });
    }

    await SupporterProfile.findByIdAndDelete(id);

    return res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Failed to delete profile:", error);
    return res.status(500).json({ error: "Failed to delete profile" });
  }
};



module.exports = {
     referSupporter,getReferals,editReferal,deleteReferal,
     createSupporterProfile,
  getSupporterProfileById,
  getAllSupporterProfiles,
  updateSupporterProfile,
  deleteSupporterProfile}


