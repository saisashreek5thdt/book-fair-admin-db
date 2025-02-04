{/*
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

// **Authentication Middleware**
const authenticate = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access Denied. No token provided or invalid format" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.error("JWT Error:", error);
    res.status(403).json({ error: "Invalid Token" });
  }
};

// **Super Admin Middleware**
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Unauthorized. Only SUPER_ADMIN can perform this action." });
  }
  next();
};

module.exports = { authenticate, isSuperAdmin };
*/}