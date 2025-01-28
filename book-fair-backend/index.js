const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const { createObjectCsvWriter } = require("csv-writer");
const fs = require("fs");
const bcrypt = require("bcrypt");
require("dotenv").config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 500;

// Route to create a new user
app.post("/users", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });
    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: "Email already exists or invalid data" });
  }
});

// Route to fetch all users as JSON
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error fetching users" });
  }
});

// Route to download users as CSV
app.get("/users/csv", async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    const path = `users-${Date.now()}.csv`;
    const csvWriter = createObjectCsvWriter({
      path,
      header: [
        { id: "id", title: "ID" },
        { id: "name", title: "Name" },
        { id: "email", title: "Email" },
        { id: "role", title: "Role" },
        { id: "createdAt", title: "Created At" },
      ],
    });

    await csvWriter.writeRecords(users);

    res.download(path, "users.csv", (err) => {
      fs.unlinkSync(path);
      if (err) {
        res.status(500).json({ success: false, error: "Error generating CSV file" });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Error fetching users" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
