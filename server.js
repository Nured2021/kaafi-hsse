const express = require("express");
const cors = require("cors");
const { runKaafiPipeline } = require("./backend/ai/pipeline");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post("/api/full-analysis", async (req, res) => {
  const { text } = req.body;

  const result = await runKaafiPipeline(text);

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`KAAFI API running on http://localhost:${PORT}`);
});
