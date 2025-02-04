const express = require("express");
const cors = require("cors");
require("dotenv").config();
//const userRoutes = require("./routes/userRoutes");
const speakerRoutes = require("./routes/speakerRoutes");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

//app.use("/users", userRoutes);
app.use("/speakers", speakerRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
