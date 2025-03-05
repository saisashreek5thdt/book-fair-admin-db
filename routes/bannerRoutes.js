const express = require("express");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const sharp = require("sharp");

const router = express.Router();
const prisma = new PrismaClient();

// Set up Multer for memory storage with a file size limit
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
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
    .resize({ width: 1200 }) // Resize to max width 1200 pixels
    .jpeg({ quality: 80 }) // Compress image
    .toBuffer();
}

// **Get Next Banner ID (Maintain Sequential Order)**
async function getNextBannerId() {
  const lastBanner = await prisma.banner.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  return lastBanner ? lastBanner.id + 1 : 1; // Start from 1 if no banners exist
}

// **Reset Banner IDs in Sequential Order**
async function resetBannerIds() {
  const banners = await prisma.banner.findMany({ orderBy: { id: "asc" } });

  for (let index = 0; index < banners.length; index++) {
    await prisma.banner.update({
      where: { id: banners[index].id },
      data: { id: index + 1 },
    });
  }
}

// **Upload Banner Image and Create Banner**
router.post("/", upload.single("image"), async (req, res) => {
  const { text, content, isActive } = req.body;
  let imageBuffer = null;

  if (req.file) {
    try {
      imageBuffer = await compressImage(req.file.buffer);
    } catch (error) {
      console.error("Image compression failed:", error);
      return res.status(500).json({ error: "Image processing failed" });
    }
  }

  try {
    const nextId = await getNextBannerId();

    const banner = await prisma.banner.create({
      data: {
        id: nextId,
        text: text || null,
        content: content || null,
        image: imageBuffer || null,
        isActive: isActive === "true" || isActive === true,
      },
    });

    res.status(201).json(banner);
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ error: "Failed to create banner" });
  }
});

// **Get All Active Banners**
router.get("/", async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });

    res.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

// **Update Banner (Partial Update)**
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { text, content, isActive } = req.body;
  let updateData = {};

  if (text) updateData.text = text;
  if (content) updateData.content = content;
  if (typeof isActive !== "undefined") updateData.isActive = isActive === "true" || isActive === true;

  if (req.file) {
    try {
      updateData.image = await compressImage(req.file.buffer);
    } catch (error) {
      console.error("Image compression failed:", error);
      return res.status(500).json({ error: "Image processing failed" });
    }
  }

  try {
    const updatedBanner = await prisma.banner.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ success: true, updatedBanner });
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({ error: "Failed to update banner" });
  }
});

// **Delete Banner and Reset IDs**
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.banner.delete({ where: { id: parseInt(id) } });

    // Reset ID sequence after deletion
    await resetBannerIds();

    res.json({ message: "Banner deleted and IDs reset successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ error: "Failed to delete banner" });
  }
});

module.exports = router;
