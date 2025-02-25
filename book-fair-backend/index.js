const express = require("express");
const cors = require("cors");
require("dotenv").config();

const speakerRoutes = require("./routes/speakerRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const publisherRoutes = require("./routes/publisherRoutes");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/speakers", speakerRoutes);
app.use("/events", eventRoutes);
app.use("/banners", bannerRoutes);
app.use("/publishers", publisherRoutes);


app.get("/", (req, res) => {
  res.send("Book Fair Backend is Running on Vercel!");
});

module.exports = app; 
