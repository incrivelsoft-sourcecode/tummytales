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
      callbackURL: "http://localhost:5001/users/google/callback",
      passReqToCallback: true, // ✅ Allows access to req in callback
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Extract and parse `state`
        const state = JSON.parse(decodeURIComponent(req.query.state || "{}"));
        console.log("State received in callback:", state);

        const { user_name, role, referral_code, permissions = [] } = state;

        // Validate role
        if (!["mom", "supporter"].includes(role)) {
          return done(new Error("Invalid role. Must be 'mom' or 'supporter'"), null);
        }

        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email: profile.emails[0].value }] });

        if (!user) {
          // Validate referral_code if role is "supporter"
          if (role === "supporter") {
            const existingMom = await User.findById(referral_code);
            if (!existingMom) {
              return done(new Error(`Invalid referral code: ${referral_code}`), null);
            }
          }

          // Create new user
          user = new User({
            user_name,
            email: profile.emails[0].value,
            googleId: profile.id,
            role,
            ...(role === "supporter" && { referral_code, permissions }),
          });

          await user.save();
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
