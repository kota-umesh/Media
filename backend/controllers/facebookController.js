const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const redisClient = require("../config/redisClient");
const jwt = require("jsonwebtoken");


//const users = {}; // Temporary in-memory storage (Use DB in production)

const frontEndURL = process.env.FRONTEND_URL || "https://thunderous-rolypoly-244b38.netlify.app";

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.BACKEND_URL/facebook/callback,
      profileFields: ["id", "displayName", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // ✅ Step 1: Fetch User's Facebook Pages & Access Tokens
        const response = await axios.get(
          `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
        );

        const pages = response.data.data.map((page) => ({
          id: page.id,
          name: page.name,
          access_token: page.access_token || null,
        }));

        // now we are using redis session 
        const user = { id: profile.id, name: profile.displayName, accessToken, pages };
        await redisClient.set(`fbUser:${profile.id}`, JSON.stringify(user));
        
        return done(null, user);
      } catch (error) {
        console.error("Error fetching pages:", error.response?.data || error.message);
        return done(error);
      }
    }
  )
);



passport.serializeUser((user, done) => {done(null, user.id)});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("🔍 Deserializing User ID:", id);

    // Fetch Facebook user data from Redis
    const userData = await redisClient.get(`fbUser:${id}`);
    if (!userData) {
      console.log("❌ No user found in Redis");
      return done(null, false);
    }

    const user = JSON.parse(userData);
    console.log("✅ Restored User from Redis:", user);

    return done(null, user);
  } catch (error) {
    console.error("❌ Error retrieving user from Redis:", error);
    return done(error);
  }
});


// ✅ Step 3: Facebook Authentication - Redirects to Facebook Login
exports.authFacebook = passport.authenticate("facebook", { 
  scope: [
    "pages_show_list", 
    "pages_manage_posts", 
    "pages_read_engagement", 
    "publish_video"
  ] 
});


exports.facebookCallback = (req, res, next) => {
  passport.authenticate("facebook", async (err, user) => {
    if (err || !user) {
      return res.redirect(`${frontEndURL}/dashboard`);
    }

    try {
      // ✅ Check if user already exists in Redis
      const existingUser = await redisClient.get(`fbUser:${user.id}`);

      if (!existingUser) {
        // ✅ Only store if not already in Redis
        await redisClient.set(`fbUser:${user.id}`, JSON.stringify(user));
      }

      // ✅ Generate JWT token
      const token = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_TOKEN, {
        expiresIn: "1h",
      });

      return res.redirect(`${frontEndURL}/facebook-post?token=${token}`);
    } catch (error) {
      console.error("❌ Error in Facebook callback:", error);
      return res.redirect(`${frontEndURL}/dashboard`);
    }
  })(req, res, next);
};




// ✅ Logout from Facebook
exports.logoutFacebook = async (req, res) => {
  try {
    const user = req.user;
    if (user) {
      await redisClient.del(`fbUser:${user.id}`);
      console.log("✅ User removed from Redis");
    }
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ error: "Failed to log out" });
  }
};

// ✅ Get Facebook Pages with Page Access Tokens
exports.getPages = async (req, res) => {
  const userId = req.user.id; // ✅ Extracted from JWT

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userData = await redisClient.get(`fbUser:${userId}`);
    if (!userData) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = JSON.parse(userData);
    res.json({ pages: user.pages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Supported video formats for Facebook

exports.postToPage = async (req, res) => {
  try {
    const { pageId, message } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const userData = await redisClient.get(`fbUser:${userId}`);
    if (!userData) return res.status(401).json({ error: "Unauthorized" });

    const user = JSON.parse(userData);
    const page = user.pages.find((p) => p.id === pageId);
    if (!page || !page.access_token) {
      return res.status(400).json({ error: "Invalid page ID or missing access token" });
    }

    let uploadedMediaIds = [];
    let videoFile = null;

    // ✅ Process uploaded files
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        console.log(`📂 Incoming File: ${file.originalname}, MIME Type: ${file.mimetype}`);

        if (!fs.existsSync(file.path)) {
          console.error(`❌ File not found: ${file.path}`);
          continue;
        }

        const formData = new FormData();
        formData.append("access_token", page.access_token);
        formData.append("source", fs.createReadStream(file.path));

        let url = "";
        if (file.mimetype.startsWith("image/")) {
          url = `https://graph.facebook.com/${pageId}/photos`;
          formData.append("published", "false");
        } else if (file.mimetype.startsWith("video/")) {
          if (!SUPPORTED_VIDEO_FORMATS.includes(file.mimetype)) {
            console.warn(`🚫 Unsupported video format: ${file.mimetype}`);
            continue;
          }
          videoFile = file;
          continue;
        } else {
          console.warn(`🚫 Unsupported file type: ${file.mimetype}`);
          continue;
        }

        try {
          console.log(`📂 Uploading: ${file.originalname} to ${url}`);
          const uploadRes = await axios.post(url, formData, { headers: formData.getHeaders() });

          if (file.mimetype.startsWith("image/")) {
            uploadedMediaIds.push({ media_fbid: uploadRes.data.id });
          }
        } catch (err) {
          console.error(`❌ Error uploading ${file.originalname}:`, err.response?.data || err.message);
        }

        fs.unlinkSync(file.path);
      }
    }

    // ✅ Post Text & Images
    let postData = { message, access_token: page.access_token };
    if (uploadedMediaIds.length > 0) {
      postData.attached_media = uploadedMediaIds;
    }

    let postResponse = null;
    if (message.trim() || uploadedMediaIds.length > 0) {
      postResponse = await axios.post(`https://graph.facebook.com/${pageId}/feed`, postData);
    }

    return res.status(200).json({
      success: true,
      postId: postResponse?.data?.id || null,
    });

  } catch (error) {
    console.error("❌ Error posting to Facebook:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to post to Facebook" });
  }
};