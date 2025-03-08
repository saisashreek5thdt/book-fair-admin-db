require("dotenv").config();
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");

const router = express.Router();
const prisma = new PrismaClient();

// Nodemailer Transporter using ENV variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// **Create a Cart Entry**
router.post("/", async (req, res) => {
  try {
    const { userName, userEmail, books, boothNumber, publisherId } = req.body;

    // Ensure books is stored as JSON
    const cartEntry = await prisma.cart.create({
      data: {
        userName,
        userEmail,
        books, // Store selected books as JSON
        boothNumber,
        publisherId,
      },
    });

    // Get Publisher Email
    const publisher = await prisma.publisher.findUnique({
      where: { id: publisherId },
    });

    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found" });
    }

    // Email to Publisher
    const publisherMailOptions = {
      from: process.env.EMAIL_USER,
      to: publisher.publisherEmail,
      subject: `New Order from ${userName}`,
      text: `User Name: ${userName}\nUser Email: ${userEmail}\nBooth Number: ${boothNumber}\nBooks: ${JSON.stringify(books)}`,
    };

    // Order Confirmation Email to User
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Order Confirmation",
      text: `Thank you, ${userName}, for your order!\nYou selected books: ${JSON.stringify(books)}\nFrom booth number: ${boothNumber}`,
    };

    // Send Emails
    await transporter.sendMail(publisherMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(201).json(cartEntry);
  } catch (error) {
    console.error("Error creating cart:", error);
    res.status(500).json({ error: "Failed to create cart" });
  }
});

// **Fetch All Cart Entries**
router.get("/", async (req, res) => {
  try {
    const cartEntries = await prisma.cart.findMany({
      include: { publisher: true },
      orderBy: { id: "asc" },
    });
    res.json(cartEntries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart entries" });
  }
});

// **Fetch a Single Cart Entry by ID**
router.get("/:id", async (req, res) => {
  try {
    const cartEntry = await prisma.cart.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { publisher: true },
    });

    if (!cartEntry) {
      return res.status(404).json({ error: "Cart entry not found" });
    }

    res.json(cartEntry);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart entry" });
  }
});

// **Update a Cart Entry**
router.put("/:id", async (req, res) => {
  try {
    const { userName, userEmail, books, boothNumber } = req.body;

    const updatedCartEntry = await prisma.cart.update({
      where: { id: parseInt(req.params.id) },
      data: { userName, userEmail, books, boothNumber },
    });

    res.json(updatedCartEntry);
  } catch (error) {
    res.status(500).json({ error: "Failed to update cart entry" });
  }
});

// **Delete a Cart Entry**
router.delete("/:id", async (req, res) => {
  try {
    await prisma.cart.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Cart entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete cart entry" });
  }
});

module.exports = router;
