const express = require("express");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const sharp = require("sharp");

const router = express.Router();
const prisma = new PrismaClient();

// Set up Multer (memory storage, 10 images max)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
});

// Compress image
async function compressImage(inputBuffer) {
  return await sharp(inputBuffer).resize({ width: 800 }).jpeg({ quality: 70 }).toBuffer();
}

// **Upload Bulk Images to Gallery (Stored as BLOBs)**
router.post("/", upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }

    // Get next ID (sequential)
    const lastImage = await prisma.gallery.findFirst({ orderBy: { id: "desc" } });
    let nextId = lastImage ? lastImage.id + 1 : 1;

    const imageData = await Promise.all(
      req.files.map(async (file, index) => {
        const compressedBuffer = await compressImage(file.buffer);
        return { id: nextId + index, image: compressedBuffer };
      })
    );

    await prisma.gallery.createMany({ data: imageData });

    res.status(201).json({ message: "Images uploaded successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error uploading images" });
  }
});

// **Get All Gallery Images (Convert BLOB to Base64)**
router.get("/", async (req, res) => {
  try {
    const images = await prisma.gallery.findMany({ orderBy: { id: "asc" } });
    const formattedImages = images.map((img) => ({
      id: img.id,
      image: img.image ? `data:image/jpeg;base64,${img.image.toString("base64")}` : null,
    }));

    res.json(formattedImages);
  } catch (error) {
    res.status(500).json({ error: "Error fetching gallery images" });
  }
});

// **Update a Specific Image**
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const compressedBuffer = await compressImage(req.file.buffer);

    await prisma.gallery.update({
      where: { id: parseInt(id) },
      data: { image: compressedBuffer },
    });

    res.json({ message: "Image updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating image" });
  }
});

// **Delete a Specific Image & Reset IDs**
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.gallery.delete({ where: { id: parseInt(id) } });

    // Reorder IDs sequentially
    const images = await prisma.gallery.findMany({ orderBy: { id: "asc" } });

    for (let i = 0; i < images.length; i++) {
      await prisma.gallery.update({
        where: { id: images[i].id },
        data: { id: i + 1 },
      });
    }

    res.json({ message: "Image deleted and IDs reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting image" });
  }
});

module.exports = router;
