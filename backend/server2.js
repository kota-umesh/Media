require("dotenv").config();
const Redis  = require("ioredis");

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const {RedisStore} = require("connect-redis");
const redisClient = require("./config/redisClient");

const authRoutes = require("./routes/authRoutes");
const facebookRoutes = require("./routes/facebookRoutes");

const frontendURL = process.env.FRONTEND_URL || "https://thunderous-rolypoly-244b38.netlify.app";

const app = express();
app.use(express.json());
app.use(cors({ origin: frontendURL, credentials: true }));
app.use(cookieParser());


app.use(passport.initialize());


app.use("/auth", authRoutes);
app.use("/facebook", facebookRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
