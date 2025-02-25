const express = require("express");
const cors = require("cors");
require("dotenv").config();
//const userRoutes = require("./routes/userRoutes");
const speakerRoutes = require("./routes/speakerRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const publisherRoutes=require("./routes/publisherRoutes");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

//app.use("/users", userRoutes);
app.use("/speakers", speakerRoutes);
app.use("/events", eventRoutes);
app.use("/banners", bannerRoutes);
app.use("/publishers", publisherRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
