const express = require("express");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
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

// Compress image before storing in the database
async function compressImage(inputBuffer) {
  return await sharp(inputBuffer)
    .resize({ width: 1200 }) // Max width 1200px
    .jpeg({ quality: 80 }) // Compress image
    .toBuffer();
}

// **Create a Publisher (Ensuring Sequential ID)**
router.post("/", upload.single("logo"), async (req, res) => {
  try {
    const { publisherName, publisherEmail, boothNumber, books } = req.body;
    let uploadedImage = null;

    if (req.file) {
      uploadedImage = await compressImage(req.file.buffer);
    }

    // Get next sequential publisher ID
    const lastPublisher = await prisma.publisher.findFirst({
      orderBy: { id: "desc" },
    });
    const nextPublisherId = lastPublisher ? lastPublisher.id + 1 : 1;

    // Ensure `books` is an array
    const bookArray = Array.isArray(books) ? books : JSON.parse(books);

    // Get next book ID
    const lastBook = await prisma.book.findFirst({
      orderBy: { id: "desc" },
    });
    let nextBookId = lastBook ? lastBook.id + 1 : 1;

    const publisher = await prisma.publisher.create({
      data: {
        id: nextPublisherId,
        publisherName,
        publisherEmail,
        boothNumber,
        logo: uploadedImage,
        books: {
          create: bookArray.map((title, index) => ({
            id: nextBookId + index, // Ensure sequential book IDs
            index: index + 1,
            title,
          })),
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

// **Delete Publisher & Reset IDs**
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.publisher.delete({ where: { id: parseInt(id) } });

    // Reorder publisher IDs
    const publishers = await prisma.publisher.findMany({ orderBy: { id: "asc" } });
    for (let i = 0; i < publishers.length; i++) {
      await prisma.publisher.update({
        where: { id: publishers[i].id },
        data: { id: i + 1 },
      });
    }

    res.json({ message: "Publisher deleted successfully and IDs reordered" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete publisher" });
  }
});

// **Add a Book to an Existing Publisher**
router.post("/:id/books", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    // Get next sequential book ID
    const lastBook = await prisma.book.findFirst({
      orderBy: { id: "desc" },
    });
    const nextBookId = lastBook ? lastBook.id + 1 : 1;

    // Get the next index within the publisher
    const lastBookIndex = await prisma.book.findFirst({
      where: { publisherId: parseInt(id) },
      orderBy: { index: "desc" },
    });

    const nextIndex = lastBookIndex ? lastBookIndex.index + 1 : 1;

    const book = await prisma.book.create({
      data: {
        id: nextBookId,
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

// **Delete a Book & Reset Book IDs & Indexes**
router.delete("/:publisherId/books/:bookId", async (req, res) => {
  const { publisherId, bookId } = req.params;

  try {
    await prisma.book.delete({ where: { id: parseInt(bookId) } });

    // Reorder books (IDs & Indexes) within the same publisher
    const books = await prisma.book.findMany({
      where: { publisherId: parseInt(publisherId) },
      orderBy: { id: "asc" },
    });

    for (let i = 0; i < books.length; i++) {
      await prisma.book.update({
        where: { id: books[i].id },
        data: {
          id: i + 1, // Reset book ID
          index: i + 1, // Reset index
        },
      });
    }

    res.json({ message: "Book deleted and IDs & indexes reordered" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete book" });
  }
});

module.exports = router;
