{/*
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { authenticate, isSuperAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

// **Register User**
router.post("/", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "USER" },
    });
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, error: "Email already exists or invalid data" });
  }
});

// **User Login**
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token, user });
});

// **Assign Role (Only SUPER_ADMIN)**
router.patch("/:id/role", authenticate, isSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["USER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Allowed roles are USER, ADMIN, and SUPER_ADMIN." });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
    });
    res.json({ success: true, updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Error updating user role" });
  }
});

module.exports = router;
*/}