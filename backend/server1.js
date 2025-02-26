require("dotenv").config();
const express = require("express");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const bodyParser = require("body-parser");
const FormData = require("form-data");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.FB_PAGE_ID;
const JWT_SECRET = process.env.JWT_TOKEN; // Replace with strong secret
const USERS = [{ id:'01', email: "admin", password: bcrypt.hashSync("123", 10) }];



// 🔹 **User Authentication (Login)**
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  //console.log(email);
  const user = USERS.find(user => user.email === email);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "24h" });
    return res.json({ success: true, token });
  }
  res.status(401).json({ success: false, message: "Invalid credentials" });
});
// 🔹 **Middleware to Verify User JWT**
const verifyToken = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
  
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }
  
      const token = authHeader.split(" ")[1];
      
      // const decoded = jwt.decode(token);
      // console.log("Received Token:", token); // Debugging line
      // console.log('decoded',decoded);
      // console.log('jwt_secret', JWT_SECRET)

      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          console.error("JWT Verification Error:", err.message);
          return res.status(403).json({ success: false, message: "Invalid or expired token" });
        }
  
        req.user = decoded; // Attach user data to request
        next();
      });
    } catch (error) {
      console.error("Token Processing Error:", error.message);
      res.status(401).json({ success: false, message: "Unauthorized token" });
    }
  };
  

// // 🔹 **Post Text**
// app.post("/api/post/text", verifyToken, async (req, res) => {
//   const { message } = req.body;
//   try {
//     const response = await axios.post(`https://graph.facebook.com/v22.0/${PAGE_ID}/feed?access_token=${PAGE_ACCESS_TOKEN}`, { message });
//     res.json({ success: true, postId: response.data.id });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to post text" });
//   }
// });

app.post("/api/post/text", verifyToken, async (req, res) => {
    const { message } = req.body;
    // const PAGE_ID = process.env.PAGE_ID;
    // const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
    //console.log('page_id',PAGE_ID);

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v22.0/${PAGE_ID}/feed`,
        { message },
        { headers: { Authorization: `Bearer ${PAGE_ACCESS_TOKEN}` } }
      );
  
      res.json({ success: true, postId: response.data.id });
    } catch (error) {
      console.error("Error posting to Facebook:", error.response?.data || error.message);
  
      res.status(500).json({
        success: false,
        message: "Failed to post text",
        error: error.response?.data || error.message,
      });
    }
  });

// 🔹 **Post Single Image with Text**
app.post("/api/post/image", verifyToken, upload.single("image"), async (req, res) => {
  const { description } = req.body;
  const imagePath = req.file.path;
  
  console.log('image path',imagePath);

  try {
  const imageData = new FormData();
    imageData.append("source", fs.createReadStream(imagePath));
    imageData.append("message", description);

    const response = await axios.post(`https://graph.facebook.com/v22.0/${PAGE_ID}/photos?access_token=${PAGE_ACCESS_TOKEN}`, imageData, {
      headers: { ...imageData.getHeaders() },
    });
    
    res.json({ success: true, postId: response.data.id });
  } catch {
    res.status(500).json({ success: false, message: "Failed to post image" });
  } finally {
    fs.unlinkSync(imagePath);
  }
});

// 🔹 **Post Multiple Images**
app.post("/api/post/multiple-images", verifyToken, upload.array("images", 5), async (req, res) => {
  const { description } = req.body;
  const imagePaths = req.files.map(file => file.path);

  try {
    let imageIDs = [];

    for (const imagePath of imagePaths) {
      const imageData = new FormData();
      imageData.append("source", fs.createReadStream(imagePath));
      imageData.append("published", "false");

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${PAGE_ID}/photos?access_token=${PAGE_ACCESS_TOKEN}`,
        imageData,
        { headers: { ...imageData.getHeaders() } }
      );

      if (response.data.id) {
        imageIDs.push(response.data.id);
      }
    }

    if (imageIDs.length > 0) {
      const postData = {
        message: description,
        attached_media: imageIDs.map(id => ({ media_fbid: id })),
      };

      const postResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${PAGE_ID}/feed?access_token=${PAGE_ACCESS_TOKEN}`,
        postData
      );

      res.json({ success: true, postId: postResponse.data.id });
    }
  } catch {
    res.status(500).json({ success: false, message: "Failed to post multiple images" });
  } finally {
    imagePaths.forEach(path => fs.unlinkSync(path));
  }
});

// 🔹 **Post Video**

const storage = multer.diskStorage({
  destination: "uploads/video",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFormats = ["video/mp4", "video/quicktime", "video/x-msvideo"]; // MP4, MOV, AVI
  if (allowedFormats.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported video format. Allowed formats: MP4, MOV, AVI."), false);
  }
};

const upload_vid = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max file size
  fileFilter,
});

app.post("/api/post/video", verifyToken, upload_vid.single("video"), async (req, res) => {
  //console.log("Uploaded file details:", req.file);
  const { description } = req.body;
  const videoPath = path.resolve(req.file.path);

  console.log('video_path', videoPath);
  console.log("Video description:", description);
  console.log("Facebook Page ID:", PAGE_ID);
  console.log("Facebook Access Token:", PAGE_ACCESS_TOKEN.substring(0, 10) + "... (hidden)");

  try {
    const videoData = new FormData();
    videoData.append("source", fs.createReadStream(videoPath));
    videoData.append("description", description);

    //console.log("FormData Headers:", videoData.getHeaders());

    const response = await axios.post(`https://graph.facebook.com/v22.0/${PAGE_ID}/videos?access_token=${PAGE_ACCESS_TOKEN}`, videoData, {
      headers: { ...videoData.getHeaders() }
    });
    console.log("Facebook API Response:", response.data)
    res.json({ success: true, postId: response.data.id });
  } catch {
    res.status(500).json({ success: false, message: "Failed to post video" });
  } finally {
    fs.unlinkSync(videoPath);
  }
});



// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));
