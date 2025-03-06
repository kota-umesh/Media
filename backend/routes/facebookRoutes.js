// const express = require("express");
// const {
//   authFacebook,
//   facebookCallback,
//   getPages,
//   postToPage,
// } = require("../controllers/facebookController");

// const router = express.Router();
// router.get("/auth-url", authFacebook);
// router.get("/callback", facebookCallback);
// router.get("/pages", getPages);
// router.post("/post", postToPage);

// module.exports = router;

const express = require("express");
const {
  authFacebook,
  facebookCallback,
  getPages,
  postToPage,
  logoutFacebook,
} = require("../controllers/facebookController");
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

const backendURL = process.env.BACKEND_URL || "http://localhost:5000";

// ✅ Return the Facebook authentication URL (Frontend will use this)
router.get("/auth-url", (req, res) => {
  res.json({ url: `${backendURL}/facebook/auth` });
});

// ✅ Facebook OAuth Routes
router.get("/auth", authFacebook);
router.get("/callback", facebookCallback);

// ✅ Fetch Connected Pages
router.get("/pages", getPages);

// ✅ Post to Facebook Page
router.post("/post",  upload.array("media"), postToPage);

router.post("/logout", logoutFacebook);

module.exports = router;
