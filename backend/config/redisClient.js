const Redis = require("ioredis");

// 🔗 Connect to Redis Cloud
const redisClient = new Redis({
  host: "redis-13906.crce182.ap-south-1-1.ec2.redns.redis-cloud.com",
  port: 13906,
  password: process.env.REDIS_PASS,
});

// Handle Redis Connection Events
redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
redisClient.on("connect", () => console.log("✅ Connected to Redis Cloud"));

module.exports = redisClient;
