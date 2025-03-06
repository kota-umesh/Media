require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const facebookRoutes = require("./routes/facebookRoutes");

const frontendURL = process.env.FRONTEND_URL || "https://67c9335d797640c797593fee--thunderous-rolypoly-244b38.netlify.app";

const app = express();
app.use(express.json());
app.use(cors({ origin: frontendURL, credentials: true }));
app.use(cookieParser());

app.use(
  session({
    secret: "super_secret",
    resave: false,
    saveUninitialized: false, // ✅ Prevents empty sessions
    cookie: {
      httpOnly: true,
      secure: true, // ✅ Required for HTTPS
      sameSite: "None", // ✅ Allows cross-origin requests
    },
  })
);

app.use((req, res, next) => {
  console.log("🔍 Session Data:", req.session);
  console.log("🔍 User in Session:", req.user);
  next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/facebook", facebookRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
