const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
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
        const isNewUser = !user; // <== Important Flag
        if (!user) {
          let existingMom = null;
          // Validate required fields
          if (!role) {
            return done(new Error("Role is required."), null);
          }

          // Auto-generate user_name if not provided
          if (!user_name) {
            const base = (
              profile.displayName?.replace(/\s+/g, '').toLowerCase() ||
              profile.emails?.[0]?.value.split('@')[0]
            );

            let tempUsername = base;
            let counter = 0;
            let exists = true;

            while (exists) {
              const existing = await User.findOne({ user_name: tempUsername });
              if (!existing) {
                exists = false;
              } else {
                counter += 1;
                tempUsername = `${base}${String(counter).padStart(2, '0')}`;
              }
            }

            user_name = tempUsername;
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
        // Attach isNewUser to req for redirect logic
        req.isNewUser = isNewUser;
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// ✅ FACEBOOK STRATEGY
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.USER_SERVICE_URL}/users/facebook/callback`,
      profileFields: ["id", "emails", "name"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const state = JSON.parse(decodeURIComponent(req.query.state || "{}"));
        const { mode, user_name, role, referal_code, permissions = [] } = state;

        const email = profile.emails && profile.emails[0] && profile.emails[0].value;

        if (!email) {
          return done(new Error("No email found in Facebook profile"), null);
        }
        // ✅ Require role
        if (!role) {
          return done(new Error("Role is required."), null);
        }
        let user = await User.findOne({ email });

        const isNewUser = !user;

        // ✅ Auto-generate username if not provided
        let finalUsername = user_name;

        if (!finalUsername) {
          const baseName = (
            `${profile.name?.givenName || ""}${profile.name?.familyName || ""}`.toLowerCase()
            || email.split('@')[0]
          ).replace(/\s+/g, '');

          let tempUsername = baseName;
          let counter = 0;
          let exists = true;

          while (exists) {
            const existing = await User.findOne({ user_name: tempUsername });
            if (!existing) {
              exists = false;
            } else {
              counter += 1;
              tempUsername = `${baseName}${String(counter).padStart(2, '0')}`;
            }
          }

          finalUsername = tempUsername;
        }

        if (!user) {
          user = new User({
            facebookId: profile.id,
            email,
            user_name: finalUsername,
            role,
            referal_code,
            permissions,
          });
        } else {
          user.facebookId = profile.id;
        }

        await user.save();
        req.isNewUser = isNewUser;
        return done(null, user);
      } catch (err) {
        return done(err, null);
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
