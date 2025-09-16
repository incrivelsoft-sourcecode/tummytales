const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

// ✅ Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.USER_SERVICE_URL}/users/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const state = JSON.parse(decodeURIComponent(req.query.state || "{}"));
        let { user_name, role, referal_code, permissions } = state;

        console.log("Email:", profile.emails[0].value);

        // 🔍 Lookup user in Python DB
        let user = null;
        try {
          const resp = await axios.get(
            `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/search`,
            {
              params: { email: profile.emails[0].value },
              headers: {
                "X-API-Key": process.env.API_KEY,
                "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
              },
            }
          );
          user = resp.data;
        } catch (err) {
          console.log("No existing user in Python DB:", profile.emails[0].value);
        }

        const isNewUser = !user;

        if (!user) {
          // ✅ Validate role
          if (!role) {
            return done(new Error("Role is required."), null);
          }

          // ✅ Auto-generate username if not provided
          if (!user_name) {
            const base =
              profile.displayName?.replace(/\s+/g, "").toLowerCase() ||
              profile.emails?.[0]?.value.split("@")[0];

            let tempUsername = base;
            let counter = 0;
            let exists = true;

            while (exists) {
              let existing = null;
              try {
                const resp = await axios.get(
                  `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/search`,
                  {
                    params: { user_name: tempUsername },
                    headers: {
                      "X-API-Key": process.env.API_KEY,
                      "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
                    },
                  }
                );
                existing = resp.data;
              } catch {
                existing = null;
              }

              if (!existing) {
                exists = false;
              } else {
                counter += 1;
                tempUsername = `${base}${String(counter).padStart(2, "0")}`;
              }
            }

            user_name = tempUsername;
          }

          // ✅ Normalize permissions
          if (typeof permissions === "string") {
            permissions = permissions.split(",").map((p) => p.trim());
          }

          // ✅ Handle supporter role
          let existingMom = null;
          if (role === "supporter") {
            if (!referal_code) {
              return done(new Error("Referral code is required for supporters."), null);
            }

            try {
              const resp = await axios.get(
                `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/search`,
                {
                  params: { user_id: referal_code },
                  headers: {
                    "X-API-Key": process.env.API_KEY,
                    "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
                  },
                }
              );
              existingMom = resp.data;
            } catch {
              return done(new Error(`Invalid referral code: ${referal_code}`), null);
            }
          }

          // ✅ Create new user in Python DB
          const payload = {
            userId: profile.id,
            user_name,
            email: profile.emails[0].value,
            googleId: profile.id,
            role,
            ...(role === "supporter" && { referal_code, permissions }),
          };

          const resp = await axios.post(
            `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.API_KEY,
                "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
              },
            }
          );
          user = { ...payload, _id: resp.data.inserted_id };

          // ✅ Update mom's referrals in Python DB
          if (role === "supporter" && existingMom) {
            await axios.patch(
              `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user`,
              { $push: { mom_referals: user._id } },
              {
                params: { user_id: existingMom._id },
                headers: {
                  "X-API-Key": process.env.API_KEY,
                  "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
                },
              }
            );
          }
        }

        req.isNewUser = isNewUser;
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// ✅ Facebook Strategy
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
        let state = {};
        try {
          state = JSON.parse(decodeURIComponent(req.query.state || "{}"));
        } catch (err) {
          console.error("Failed to parse state:", req.query.state);
        }

        const { user_name, role, referal_code, permissions = [] } = state;
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in Facebook profile"), null);
        }
        if (!role) {
          return done(new Error("Role is required."), null);
        }

        // 🔍 Lookup user in Python DB
        let user = null;
        try {
          const resp = await axios.get(
            `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/search`,
            {
              params: { email },
              headers: {
                "X-API-Key": process.env.API_KEY,
                "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
              },
            }
          );
          user = resp.data;
        } catch {
          console.log("No existing user in Python DB:", email);
        }

        const isNewUser = !user;

        // ✅ Auto-generate username
        let finalUsername = user_name;
        if (!finalUsername) {
          const base =
            `${profile.name?.givenName || ""}${profile.name?.familyName || ""}`.toLowerCase() ||
            email.split("@")[0];

          let tempUsername = base.replace(/\s+/g, "");
          let counter = 0;
          let exists = true;

          while (exists) {
            let existing = null;
            try {
              const resp = await axios.get(
                `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/search`,
                {
                  params: { user_name: tempUsername },
                  headers: {
                    "X-API-Key": process.env.API_KEY,
                    "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
                  },
                }
              );
              existing = resp.data;
            } catch {
              existing = null;
            }

            if (!existing) {
              exists = false;
            } else {
              counter += 1;
              tempUsername = `${base}${String(counter).padStart(2, "0")}`;
            }
          }

          finalUsername = tempUsername;
        }

        // ✅ Insert or update user
        if (!user) {
          const payload = {
            userId: profile.id,
            facebookId: profile.id,
            email,
            user_name: finalUsername,
            role,
            referal_code,
            permissions,
          };

          const resp = await axios.post(
            `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": process.env.API_KEY,
                "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
              },
            }
          );
          user = { ...payload, _id: resp.data.inserted_id };
        } else {
          await axios.patch(
            `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user`,
            { facebookId: profile.id },
            {
              params: { user_id: user._id },
              headers: {
                "X-API-Key": process.env.API_KEY,
                "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
              },
            }
          );
        }

        req.isNewUser = isNewUser;
        return done(null, user);
      } catch (err) {
        return done(new Error("Facebook login failed: " + err.message), null);
      }
    }
  )
);

// ✅ Serialize / Deserialize using Python API
passport.serializeUser((user, done) => done(null, user._id));

passport.deserializeUser(async (id, done) => {
  try {
    const resp = await axios.get(
      `${process.env.PYTHON_USER_ONBOARDING_URL}/useronboarding/user/search`,
      {
        params: { user_id: id },
        headers: {
          "X-API-Key": process.env.API_KEY,
          "X-Agent-Key": process.env.API_KEY_USER_ONBOARDING,
        },
      }
    );
    done(null, resp.data);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
