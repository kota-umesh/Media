const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_TOKEN;

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
    res.cookie("authToken", token, { httpOnly: true, secure:true, sameSite: "none", path: "/",   }).json({ message: "Login successful" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
};

exports.checkAuth = (req, res) => {
  const authToken = req.cookies.authToken; // App login token
  const fbToken = req.headers["authorization"]; // Facebook token from frontend request

  if (authToken) {
    try {
      jwt.verify(authToken, JWT_SECRET);
      return res.json({ authenticated: true });
    } catch (err) {
      console.log("❌ Invalid app login token:", err.message);
    }
  }

  if (fbToken) {
    try {
      jwt.verify(fbToken, JWT_SECRET);
      return res.json({ authenticated: true });
    } catch (err) {
      console.log("❌ Invalid Facebook token:", err.message);
    }
  }

  return res.json({ authenticated: false });
};

exports.logout = (req, res) => {
  res.clearCookie("authToken").json({ message: "Logged out successfully" });
};
