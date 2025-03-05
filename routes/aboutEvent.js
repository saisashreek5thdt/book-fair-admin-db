const express = require("express");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Set up Multer for in-memory storage (50MB limit)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Only video files are allowed!"));
    }
    cb(null, true);
  },
});

// **Create Event (Stores Video in Database)**
router.post("/", upload.single("video"), async (req, res) => {
  const { title, description, location, date } = req.body;
  let videoBuffer = null;

  if (req.file) {
    videoBuffer = req.file.buffer;
  }

  try {
    const event = await prisma.aboutEvent.create({
      data: { title, description, location, date: new Date(date), video: videoBuffer },
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: "Error adding event" });
  }
});

// **Get All Events (Convert Video to Base64)**
router.get("/", async (req, res) => {
  try {
    const events = await prisma.aboutEvent.findMany({
      orderBy: { date: "asc" },
    });

    // Convert video buffer to Base64 for frontend display
    const formattedEvents = events.map(event => ({
      ...event,
      video: event.video ? `data:video/mp4;base64,${event.video.toString("base64")}` : null,
    }));

    res.json(formattedEvents);
  } catch (error) {
    res.status(500).json({ error: "Error fetching events" });
  }
});

// **Update Event (Update Video if Provided)**
router.put("/:id", upload.single("video"), async (req, res) => {
  const { id } = req.params;
  const { title, description, location, date } = req.body;

  let updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (location) updateData.location = location;
  if (date) updateData.date = new Date(date);

  if (req.file) {
    updateData.video = req.file.buffer; // Store new video if uploaded
  }

  try {
    const updatedEvent = await prisma.aboutEvent.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ success: true, updatedEvent });
  } catch (error) {
    res.status(500).json({ error: "Error updating event or Event not found" });
  }
});

// **Delete Event**
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.aboutEvent.delete({ where: { id: parseInt(id) } });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting event" });
  }
});

module.exports = router;
