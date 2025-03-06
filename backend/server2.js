require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const facebookRoutes = require("./routes/facebookRoutes");

const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";

const app = express();
app.use(express.json());
app.use(cors({ origin: frontendURL, credentials: true }));
app.use(cookieParser());

app.use(
  session({ secret: "super_secret", resave: false, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/facebook", facebookRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
