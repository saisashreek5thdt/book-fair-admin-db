const express = require("express");
const multer = require("multer");
const cloudinary = require("../cloudinary");
const { PrismaClient } = require("@prisma/client");
//const { authenticate, isSuperAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.diskStorage({}) });

// **Add Speaker**
router.post("/", upload.single("image"), async (req, res) => {
  const { name, designation, note, isActive } = req.body;
  let imageUrl = null;

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, { folder: "Speaker" });
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

// **Get All Speakers**
router.get("/", async (req, res) => {
  const speakers = await prisma.speaker.findMany();
  res.json(speakers);
});

// **Update Speaker**
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, designation, note, isActive } = req.body;

  let updateData = {};
  if (name) updateData.name = name;
  if (designation) updateData.designation = designation;
  if (note) updateData.note = note;
  if (typeof isActive !== "undefined") updateData.isActive = isActive === "true";

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, { folder: "Speaker" });
    updateData.imageUrl = result.secure_url;
  }

  try {
    const updatedSpeaker = await prisma.speaker.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ success: true, updatedSpeaker });
  } catch (error) {
    res.status(500).json({ error: "Error updating speaker or Speaker not found" });
  }
});

module.exports = router;
