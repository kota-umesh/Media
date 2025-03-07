const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");


const Redis = require("ioredis");
const redisClient = new Redis({
  host: "redis-13906.crce182.ap-south-1-1.ec2.redns.redis-cloud.com",
  port: 13906,
  password: process.env.REDIS_PASS,
});

//const users = {}; // Temporary in-memory storage (Use DB in production)

const frontEndURL = process.env.FRONTEND_URL || "https://67c9335d797640c797593fee--thunderous-rolypoly-244b38.netlify.app";

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "https://media-6zl6.onrender.com/facebook/callback",
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

        // ✅ Step 2: Store User Data in Memory (Replace with DB in Production)
        // users[profile.id] = { 
        //   id: profile.id, 
        //   name: profile.displayName, 
        //   accessToken, 
        //   pages 
        // };
        //return done(null, users[profile.id]);

        // now we are using redis session 
        const user = { id: profile.id, name: profile.displayName, accessToken, pages };
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
    const userData = await redisClient.get(`user:${id}`);
    if (!userData) return done(null, false);

    const user = JSON.parse(userData);
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



// ✅ Step 4: Facebook Callback - Handles Success/Failure & Redirects
// exports.facebookCallback = (req, res, next) => {
//   passport.authenticate("facebook", (err, user) => {
//     if (err || !user) {
//       return res.redirect(`${frontEndURL}/dashboard`); // ❌ Stay on dashboard if login fails
//     }
    
//     req.login(user, (loginErr) => {
//       if (loginErr) {
//         return res.redirect(`${frontEndURL}/dashboard`);
//       }
//       return res.redirect(`${frontEndURL}/facebook-post`); // ✅ Go to Facebook Post page after login
//     });
//   })(req, res, next);
// };

exports.facebookCallback = (req, res, next) => {
  passport.authenticate("facebook", (err, user) => {
    if (err || !user) {
      return res.redirect(`${frontEndURL}/dashboard`);
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(`${frontEndURL}/dashboard`);
      }

      // ✅ Store user ID in session
      req.session.user = user;
      
      return res.redirect(`${frontEndURL}/facebook-post`);
    });
  })(req, res, next);
};



exports.logoutFacebook = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Error destroying session:", err);
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.clearCookie("connect.sid");
      console.log("✅ User logged out from Facebook");
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ error: "Failed to log out" });
  }
};


// ✅ Step 5: Get Facebook Pages with Page Access Tokens
exports.getPages = async (req, res) => {
  console.log("🔍 Session on /facebook/pages:", req.session);
  console.log("🔍 Stored User Data:", req.session.cookie);
  const user = req.session.user;
  if (!user) {
    console.error("❌ User not found in memory!");
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("✅ Retrieved User Data:", user);
  console.log("✅ Stored Pages:", user.pages);

  try {
    res.json({ pages: user.pages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ Supported video formats for Facebook
const SUPPORTED_VIDEO_FORMATS = ["video/mp4", "video/quicktime"];

exports.postToPage = async (req, res) => {
  try {
    const { pageId, message } = req.body;
    const user = req.session.user;

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const page = user.pages.find((p) => p.id === pageId);
    if (!page || !page.access_token) {
      return res.status(400).json({ error: "Invalid page ID or missing access token" });
    }

    let uploadedMediaIds = [];
    let videoFile = null;

    // ✅ Log Incoming Files
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
          formData.append("published", "false"); // ✅ Unpublished media
        } else if (file.mimetype.startsWith("video/")) {
          if (!SUPPORTED_VIDEO_FORMATS.includes(file.mimetype)) {
            console.warn(`🚫 Unsupported video format: ${file.mimetype}`);
            continue;
          }
          videoFile = file; // ✅ Store video for separate processing
          continue;
        } else {
          console.warn(`🚫 Unsupported file type: ${file.mimetype}`);
          continue;
        }

        try {
          console.log(`📂 Uploading: ${file.originalname} to ${url}`);
          const uploadRes = await axios.post(url, formData, { headers: formData.getHeaders() });

          if (file.mimetype.startsWith("image/")) {
            uploadedMediaIds.push({ media_fbid: uploadRes.data.id }); // ✅ Store image ID
          }
        } catch (err) {
          console.error(`❌ Error uploading ${file.originalname}:`, err.response?.data || err.message);
        }

        fs.unlinkSync(file.path); // ✅ Cleanup uploaded files
      }
    }

    // ✅ Step 1: Post Text & Images (If Any)
    let postData = {
      message,
      access_token: page.access_token,
    };

    if (uploadedMediaIds.length > 0) {
      postData.attached_media = uploadedMediaIds; // ✅ Attach all images
    }

    let postResponse = null;
    if (message.trim() || uploadedMediaIds.length > 0) {
      postResponse = await axios.post(`https://graph.facebook.com/${pageId}/feed`, postData);
    }

    // ✅ Step 2: Upload and Post Video Separately (If Any)
    let videoPostId = null;
    if (videoFile) {
      console.log(`📂 Video File Details: ${JSON.stringify({
        originalName: videoFile.originalname,
        path: videoFile.path,
        mimetype: videoFile.mimetype,
        size: videoFile.size,
      }, null, 2)}`);

      if (!fs.existsSync(videoFile.path)) {
        console.error(`❌ Video file not found: ${videoFile.path}`);
        return res.status(400).json({ error: "Video file not found" });
      }

      const videoForm = new FormData();
      videoForm.append("access_token", page.access_token);
      videoForm.append("source", fs.createReadStream(videoFile.path));
      videoForm.append("description", message || "Uploaded via API");

      try {
        console.log(`📂 Uploading video: ${videoFile.originalname}`);
        const videoUploadRes = await axios.post(`https://graph.facebook.com/${pageId}/videos`, videoForm, {
          headers: videoForm.getHeaders(),
        });

        const videoId = videoUploadRes.data.id;
        console.log("📹 Video uploaded, waiting for processing...");

        // ✅ Wait for Video Processing
        let attempts = 10;
        while (attempts > 0) {
          try {
            const statusRes = await axios.get(`https://graph.facebook.com/${videoId}?fields=status&access_token=${page.access_token}`);
            const status = statusRes.data.status?.video_status;

            if (status === "ready") {
              console.log("✅ Video processed successfully!");
              videoPostId = videoId;
              break;
            } else {
              console.log(`⏳ Video still processing... (${attempts} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 sec
            }
          } catch (statusError) {
            console.error("❌ Error checking video status:", statusError.response?.data || statusError.message);
            break;
          }
          attempts--;
        }

        if (attempts === 0) {
          console.warn("⚠️ Video processing timeout, video may not be available yet.");
        }
      } catch (videoErr) {
        console.error("❌ Error uploading video:", videoErr.response?.data || videoErr.message);
      }

      fs.unlinkSync(videoFile.path); // ✅ Cleanup video file
    }

    return res.status(200).json({
      success: true,
      postId: postResponse?.data?.id || null,
      videoPostId: videoPostId || null,
    });

  } catch (error) {
    console.error("❌ Error posting to Facebook:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to post to Facebook" });
  }
};
