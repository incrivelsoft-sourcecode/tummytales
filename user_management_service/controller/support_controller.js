const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require("axios");
const UserDetails = require('../model/User.js');
const crypto = require("crypto");
const sendReferralEmail = require("../utils/sendReferralEmail.js");

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


module.exports = {
     referSupporter,getReferals,editReferal,deleteReferal }


