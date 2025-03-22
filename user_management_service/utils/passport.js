const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');
const User = require("../model/User.js");

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.USER_SERVICE_URL}/users/google/callback`,
      passReqToCallback: true, // ✅ Allows access to req in callback
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Extract and parse `state`
        const state = JSON.parse(decodeURIComponent(req.query.state || "{}"));
        console.log("State received in callback:", state);

        let { user_name, role, referal_code, permissions } = state;

        console.log("Email:", profile.emails[0].value);
        
        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email: profile.emails[0].value }]
        });

        console.log("Existing user:", user);

        if (!user) {
          let existingMom = null;
          // Validate required fields
        if (!user_name || !role) {
          return done(new Error("user_name or role is missing."), null);
        }
        if (!["mom", "supporter"].includes(role)) {
          return done(new Error("Invalid role. Must be 'mom' or 'supporter'."), null);
        }

        // Convert permissions to an array if it's a string
        if (typeof permissions === "string") {
          permissions = permissions.split(",").map((perm) => perm.trim());
        }

          if (role === "supporter") {
            if (!referal_code) {
              return done(new Error("Referral code is required for supporters."), null);
            }

            existingMom = await User.findById(referal_code);
            if (!existingMom) {
              return done(new Error(`Invalid referral code: ${referal_code}`), null);
            }
          }

          // Create new user
          user = new User({
            user_name,
            email: profile.emails[0].value,
            googleId: profile.id,
            role,
            ...(role === "supporter" && { referal_code, permissions }),
          });

          await user.save();

          // Add supporter to mom's referrals
          if (role === "supporter" && existingMom) {
            existingMom.mom_referals = existingMom.mom_referals || [];
            existingMom.mom_referals.push(user._id);
            await existingMom.save();
          }
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
