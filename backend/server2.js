const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

const users = {}; // Temporary storage

const JWT_SECRET = process.env.JWT_SECRET || "default_secret"; // Use env variable

if (!process.env.FB_APP_ID || !process.env.FB_APP_SECRET) {
  console.error("❌ Missing Facebook OAuth credentials in .env file");
  process.exit(1);
}

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// ✅ Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FB_APP_ID,
      clientSecret: process.env.FB_APP_SECRET,
      callbackURL: process.env.FB_CALLBACK_URL || "http://localhost:5000/auth/facebook/callback",
      profileFields: ["id", "displayName", "emails"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // ✅ Exchange for long-lived token (60 days)
        const response = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
          params: {
            grant_type: "fb_exchange_token",
            client_id: process.env.FB_APP_ID,
            client_secret: process.env.FB_APP_SECRET,
            fb_exchange_token: accessToken,
          },
        });

        const longLivedToken = response.data.access_token;

        // Store user details
        users[profile.id] = { id: profile.id, name: profile.displayName, accessToken: longLivedToken };
        return done(null, profile);
      } catch (error) {
        console.error("❌ Error exchanging token:", error.response?.data || error.message);
        return done(error, null);
      }
    }
  )
);

// ✅ JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token." });
  }
};

// ✅ Dummy Login API with JWT
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "admin" && password === "123") {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
    return res.json({ token, expiresIn: 7200 });
  }
  res.status(401).json({ message: "Invalid credentials" });
});

// ✅ Facebook Auth Routes
app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["public_profile", "email", "pages_manage_posts", "pages_show_list"] }));

app.get("/auth/facebook/callback", passport.authenticate("facebook", { session: false }), (req, res) => {
  const user = users[req.user.id];
  if (user) {
    const token = jwt.sign({ id: user.id, name: user.name, accessToken: user.accessToken }, JWT_SECRET, { expiresIn: "24h" });
    return res.redirect(`https://67bf69331be4711745a55b27--jade-boba-4e902d.netlify.app/dashboard?token=${token}`);
  }
  res.status(401).json({ message: "Facebook authentication failed" });
});

// ✅ Fetch Facebook Pages (Protected)
app.get("/api/facebook/pages", authenticateToken, async (req, res) => {
  try {
    const { accessToken } = req.user;
    const response = await axios.get(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
    
    // Extract pages and page access tokens
    const pages = response.data.data.map((page) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token, // ✅ This is the correct token to use for posting
    }));

    res.json(pages);
  } catch (error) {
    console.error("❌ Failed to fetch Facebook pages:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch Facebook pages" });
  }
});

// ✅ Create Facebook Post (Protected)
app.post("/api/facebook/post", authenticateToken, async (req, res) => {
  try {
    const { pageId, message, pageAccessToken } = req.body; // Use page access token
    if (!pageId || !message || !pageAccessToken) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const response = await axios.post(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      message,
      access_token: pageAccessToken, // ✅ Use the correct page token
    });

    res.json(response.data);
  } catch (error) {
    console.error("❌ Failed to create post:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
