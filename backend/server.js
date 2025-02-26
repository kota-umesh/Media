require("dotenv").config();
const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const FormData = require("form-data");

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const upload = multer({ dest: "uploads/" });

const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const JWT_TOKEN = process.env.JWT_SECRET;
const PAGE_ID = process.env.FB_PAGE_ID;

// Dummy user database
const users = [
  { id: 1, email: "user", password: bcrypt.hashSync("123", 10) },
];

// 🔹 **User Authentication (JWT)**
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);

  if (!user) return res.status(400).json({ message: "User not found" });

  bcrypt.compare(password, user.password, (err, isMatch) => {
    if (err) return res.status(500).json({ message: "Internal server error" });
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userEmail: user.email }, JWT_TOKEN, { expiresIn: "1h" });
    res.json({ token });
  });
});


// 🔹 **Post Image & Description to Facebook Page**
app.post("/api/post", upload.single("image"), async (req, res) => {
  const { token, description } = req.body;
  const imagePath = req.file?.path;

  try {
    if (!imagePath || !fs.existsSync(imagePath)) {
      return res.status(400).json({ success: false, message: "Image file missing" });
    }

    jwt.verify(token, JWT_TOKEN)

    // Facebook Graph API Endpoint
    const imageUploadURL = `https://graph.facebook.com/v22.0/${PAGE_ID}/photos?access_token=${PAGE_ACCESS_TOKEN}`;

     // Create FormData for image upload
    const imageData = new FormData();
    imageData.append("source", fs.createReadStream(imagePath));
    imageData.append("message", description);

    // Upload image to Facebook Page
    const response = await axios.post(imageUploadURL, imageData, {
      headers: imageData.getHeaders(),
    });

    // Clean up temporary file
    fs.unlinkSync(imagePath);

    if (response.data.id) {
      res.json({ success: true, message: "Post successful", postId: response.data.id });
    } else {
      res.json({ success: false, message: "Failed to post" });
    }
  } catch (error) {
    console.error("Error posting to Facebook:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});



// Start Server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
