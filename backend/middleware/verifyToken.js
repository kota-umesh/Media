const jwt = require("jsonwebtoken");

exports.verifyFbToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    req.user = decoded; // Add user to request
    next(); // Proceed to the next middleware
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
