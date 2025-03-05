const express = require("express");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const sharp = require("sharp");

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Compress image
async function compressImage(inputBuffer) {
  return await sharp(inputBuffer).resize({ width: 800 }).jpeg({ quality: 70 }).toBuffer();
}

// **Add Team Member (Image Stored as BLOB)**
router.post("/", upload.single("image"), async (req, res) => {
  const { name, description, shortName } = req.body;
  let imageBuffer = null;

  if (req.file) {
    try {
      imageBuffer = await compressImage(req.file.buffer);
    } catch (error) {
      return res.status(500).json({ error: "Image compression failed" });
    }
  }

  try {
    const teamMember = await prisma.team.create({
      data: { name, description, shortName, image: imageBuffer },
    });

    res.status(201).json(teamMember);
  } catch (error) {
    res.status(500).json({ error: "Error adding team member" });
  }
});

// **Get All Team Members (Convert BLOB to Base64)**
router.get("/", async (req, res) => {
  try {
    const teams = await prisma.team.findMany();
    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      shortName: team.shortName,
      image: team.image ? `data:image/jpeg;base64,${team.image.toString("base64")}` : null,
    }));

    res.json(formattedTeams);
  } catch (error) {
    res.status(500).json({ error: "Error fetching teams" });
  }
});

module.exports = router;
