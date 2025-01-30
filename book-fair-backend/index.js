const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("./cloudinary");
const { createObjectCsvWriter } = require("csv-writer");
require("dotenv").config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET||"mysecret";

// Multer setup for file uploads
const storage = multer.diskStorage({});
const upload = multer({ storage });

// **Authenticate Middleware**
const authenticate = async (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access Denied" });

  try {
    console.log("Token received:", token);
console.log("Secret used:", JWT_SECRET);

    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid Token" });
  }
};

// **Admin Middleware**
const isAdmin = async (req, res, next) => {
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
};

// **1. Register User**
app.post("/users", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, error: "Email already exists or invalid data" });
  }
});

// **2. User Login**
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token, user });
});

// **3. Add Speaker with Image Upload**
app.post("/speakers", authenticate, isAdmin, upload.single("image"), async (req, res) => {
  const { name, designation, note, isActive } = req.body;
  
  let imageUrl = null;
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path);
    imageUrl = result.secure_url;
  }

  try {
    const speaker = await prisma.speaker.create({
      data: { name, designation, note, imageUrl, isActive: isActive === "true" },
    });
    res.status(201).json(speaker);
  } catch (error) {
    res.status(500).json({ error: "Error adding speaker" });
  }
});

// **4. Get All Speakers**
app.get("/speakers", async (req, res) => {
  const speakers = await prisma.speaker.findMany();
  res.json(speakers);
});

// **5. Get Speaker by ID**
app.get("/speakers/:id", async (req, res) => {
  const { id } = req.params;
  const speaker = await prisma.speaker.findUnique({ where: { id: parseInt(id) } });

  if (!speaker) return res.status(404).json({ error: "Speaker not found" });
  res.json(speaker);
});

// **6. Update Speaker**
app.put("/speakers/:id", authenticate, isAdmin, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, designation, note, isActive } = req.body;
  
  let updateData = { name, designation, note, isActive: isActive === "true" };

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path);
    updateData.imageUrl = result.secure_url;
  }

  const updatedSpeaker = await prisma.speaker.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  res.json(updatedSpeaker);
});

// **7. Delete Speaker**
app.delete("/speakers/:id", authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  await prisma.speaker.delete({ where: { id: parseInt(id) } });
  res.json({ message: "Speaker deleted successfully" });
});

// **Start Server**
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
