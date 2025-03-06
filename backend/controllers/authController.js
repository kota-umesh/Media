const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_TOKEN;

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
    res.cookie("authToken", token, { httpOnly: true, sameSite: "Strict" }).json({ message: "Login successful" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
};

exports.checkAuth = (req, res) => {
  const token = req.cookies.authToken;
  if (!token) return res.json({ authenticated: false });

  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("authToken").json({ message: "Logged out successfully" });
};
