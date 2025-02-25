const express = require("express");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const cloudinary = require("../cloudinary");
const sharp = require("sharp");

const router = express.Router();
const prisma = new PrismaClient();

// Configure Multer (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
});

// Compress image before uploading
async function compressImage(inputBuffer) {
  return await sharp(inputBuffer)
    .resize({ width: 1200 }) // Max width 1200px
    .jpeg({ quality: 80 }) // Compress image
    .toBuffer();
}

router.post("/", upload.single("logo"), async (req, res) => {
    try {
      const { publisherName, publisherEmail, boothNumber, books } = req.body;
      let uploadedImage = null;
  
      console.log("Received Data:", req.body); // Debugging
  
      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "publisher_logo",resource_type: "image" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });
  
        uploadedImage = result.secure_url;
      }
  
      //  Ensure `books` is an array
      const bookArray = Array.isArray(books) ? books : JSON.parse(books);
  
      const publisher = await prisma.publisher.create({
        data: {
          publisherName,
          publisherEmail,
          boothNumber,
          logo: uploadedImage,
          books: {
            create: bookArray.map((title) => ({ title })), //  Ensure book format
          },
        },
        include: { books: true },
      });
  
      res.status(201).json(publisher);
    } catch (error) {
      console.error("Error Creating Publisher:", error);
      res.status(500).json({ error: "Failed to create publisher", details: error.message });
    }
  });

// **Get All Publishers with Books**
router.get("/", async (req, res) => {
  try {
    const publishers = await prisma.publisher.findMany({
      include: { books: { orderBy: { index: "asc" } } },
    });
    res.json(publishers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch publishers" });
  }
});

// **Get a Single Publisher by ID**
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const publisher = await prisma.publisher.findUnique({
      where: { id: parseInt(id) },
      include: { books: { orderBy: { index: "asc" } } },
    });

    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }

    res.json(publisher);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch publisher" });
  }
});

// **Add a Book to an Existing Publisher**
router.post("/:id/books", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const lastBook = await prisma.book.findFirst({
      where: { publisherId: parseInt(id) },
      orderBy: { index: "desc" },
    });

    const nextIndex = lastBook ? lastBook.index + 1 : 1;

    const book = await prisma.book.create({
      data: {
        index: nextIndex,
        name,
        publisherId: parseInt(id),
      },
    });

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ error: "Failed to add book" });
  }
});

// **Update Publisher**
router.put("/:id", upload.single("logo"), async (req, res) => {
  const { id } = req.params;
  const { publisherName, publisherEmail, boothNumber } = req.body;
  let updateData = {};

  if (publisherName) updateData.publisherName = publisherName;
  if (publisherEmail) updateData.publisherEmail = publisherEmail;
  if (boothNumber) updateData.boothNumber = boothNumber;

  if (req.file) {
    try {
      const compressedBuffer = await compressImage(req.file.buffer);
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "publisher_logos" },
          (error, result) => (error ? reject(error) : resolve(result))
        ).end(compressedBuffer);
      });

      updateData.logo = result.secure_url;
    } catch (error) {
      return res.status(500).json({ error: "Image upload failed" });
    }
  }

  try {
    const updatedPublisher = await prisma.publisher.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json(updatedPublisher);
  } catch (error) {
    res.status(500).json({ error: "Failed to update publisher" });
  }
});

// **Delete Publisher and Reset Books**
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.publisher.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Publisher deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete publisher" });
  }
});

module.exports = router;
