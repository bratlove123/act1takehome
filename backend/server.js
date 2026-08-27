require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const itemsRouter = require("./routes/items");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/items", itemsRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Optionally serve the built frontend from the same origin (single-container mode).
const FRONTEND_DIST = process.env.FRONTEND_DIST;
if (FRONTEND_DIST && fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get("*", (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
