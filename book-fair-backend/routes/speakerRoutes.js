const express = require("express");
const multer = require("multer");
const cloudinary = require("../cloudinary");
const { PrismaClient } = require("@prisma/client");
const sharp = require("sharp");

const router = express.Router();
const prisma = new PrismaClient();

// Set up Multer for 5 MB limit (store file in memory, not disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
});

// **Compress Image in Memory**
async function compressImage(inputBuffer) {
  return await sharp(inputBuffer)
    .resize({ width: 800 }) // Resize to max width 800 pixels
    .jpeg({ quality: 70 }) // Compress image
    .toBuffer(); // Return buffer instead of saving to file
}

// **Get Next ID**
async function getNextSpeakerId() {
  const lastSpeaker = await prisma.speaker.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  return lastSpeaker ? lastSpeaker.id + 1 : 1; // If no speakers exist, start from 1
}

// **Add Speaker**
router.post("/", upload.single("image"), async (req, res) => {
  const { name, designation, note, isActive } = req.body;
  let imageUrl = null;

  if (req.file) {
    try {
      const compressedBuffer = await compressImage(req.file.buffer);

      // Upload compressed buffer to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "Speaker", resource_type: "image" },
          (error, result) => (error ? reject(error) : resolve(result))
        ).end(compressedBuffer);
      });

      imageUrl = result.secure_url;
    } catch (error) {
      console.error("Image compression or upload failed:", error);
      return res.status(500).json({ error: "Image compression or upload failed" });
    }
  }

  try {
    const nextId = await getNextSpeakerId();

    const speaker = await prisma.speaker.create({
      data: { id: nextId, name, designation, note, imageUrl, isActive: isActive === "true" },
    });

    res.status(201).json(speaker);
  } catch (error) {
    res.status(500).json({ error: "Error adding speaker" });
  }
});

// **Get All Speakers**
router.get("/", async (req, res) => {
  const speakers = await prisma.speaker.findMany({ orderBy: { id: "asc" } });
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
    try {
      const compressedBuffer = await compressImage(req.file.buffer);

      // Upload compressed buffer to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "Speaker", resource_type: "image" },
          (error, result) => (error ? reject(error) : resolve(result))
        ).end(compressedBuffer);
      });

      updateData.imageUrl = result.secure_url;
    } catch (error) {
      return res.status(500).json({ error: "Image compression or upload failed" });
    }
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

// **Delete Speaker and Reset IDs**
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.speaker.delete({ where: { id: parseInt(id) } });

    // Reset speaker IDs to ensure sequential order
    const remainingSpeakers = await prisma.speaker.findMany({ orderBy: { id: "asc" } });
    for (let index = 0; index < remainingSpeakers.length; index++) {
      await prisma.speaker.update({
        where: { id: remainingSpeakers[index].id },
        data: { id: index + 1 },
      });
    }

    res.json({ message: "Speaker deleted and IDs reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting speaker or resetting IDs" });
  }
});

module.exports = router;
