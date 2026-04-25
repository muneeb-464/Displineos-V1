require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",      // ← change from "strict" to "lax"
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};


// Configure Google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const profilePicture = profile.photos?.[0]?.value || "";
        const user = await User.findOneAndUpdate(
          { googleId: profile.id },
          {
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            profilePicture,
          },
          { upsert: true, new: true }
        );
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// GET /auth/google — redirect to Google consent screen
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /auth/google/callback — handle Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
  (req, res) => {
    const user = req.user;
    // Issue #3 fixed: email removed from JWT payload — only id needed, email fetched from DB on /auth/me
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, COOKIE_OPTIONS);
    res.redirect(process.env.CLIENT_URL);
  }
);

// GET /auth/me — verify JWT cookie, return user
router.get("/me", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("-__v -googleId");
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// POST /auth/logout — clear JWT cookie
// Issue #4 fixed: clearCookie must receive same options used when setting the cookie
router.post("/logout", (_req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({ success: true });
});

module.exports = router;
