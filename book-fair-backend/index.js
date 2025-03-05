const express = require("express");
const cors = require("cors");
require("dotenv").config();
//const userRoutes = require("./routes/userRoutes");
const speakerRoutes = require("./routes/speakerRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const publisherRoutes=require("./routes/publisherRoutes");
const aboutEventRoutes = require("./routes/aboutEvent");
const galleryRoutes = require("./routes/gallery");
const partnersRoutes = require("./routes/partners");
const teamsRoutes = require("./routes/teams");


const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

//app.use("/users", userRoutes);
app.use("/speakers", speakerRoutes);
app.use("/events", eventRoutes);
app.use("/banners", bannerRoutes);
app.use("/publishers", publisherRoutes);
app.use("/aboutEvent", aboutEventRoutes);
app.use("/gallery", galleryRoutes);
app.use("/partners", partnersRoutes);
app.use("/teams", teamsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
