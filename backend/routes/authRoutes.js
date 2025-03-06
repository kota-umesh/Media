// const express = require("express");
// const { login } = require("../controllers/authController");

// const router = express.Router();
// router.post("/login", login);

// module.exports = router;


const express = require("express");
const { login, checkAuth, logout } = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.get("/check-auth", checkAuth);
router.post("/logout", logout);

module.exports = router;
