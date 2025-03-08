const express = require("express");
const {
  authFacebook,
  facebookCallback,
  getPages,
  postToPage,
  logoutFacebook,
} = require("../controllers/facebookController");
const { verifyFbToken } = require("../middleware/verifyToken");
const multer = require("multer");

const router = express.Router();
const upload = multer({
  dest: 'uploads/', 
  preservePath: true,
  fileFilter: (req, file, cb) => {
    console.log(`📂 Incoming File: ${file.originalname}, MIME Type: ${file.mimetype}`);
    cb(null, true);
  }
}); // Store files temporarily in "uploads/"

const backendURL = process.env.BACKEND_URL || "https://media-6zl6.onrender.com";

// ✅ Return the Facebook authentication URL (Frontend will use this)
router.get("/auth-url", (req, res) => {
  res.json({ url: `${backendURL}/facebook/auth` });
});

// ✅ Facebook OAuth Routes
router.get("/auth", authFacebook);
router.get("/callback", facebookCallback);

// ✅ Fetch Connected Pages
router.get("/pages", verifyFbToken, getPages);

// ✅ Post to Facebook Page
router.post("/post", verifyFbToken,  upload.array("media"), postToPage);

router.post("/logout", verifyFbToken, logoutFacebook);

module.exports = router;
