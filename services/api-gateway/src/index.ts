import "dotenv/config";
import express from "express";

// Import the configured Express apps from our local workspace packages
import transcriptApp from "transcript-service";
import aiApp from "ai-service";

const app = express();
const PORT = process.env.PORT || 3000;

// Mount the microservices under their respective base paths
// Since they already define /api/v1/..., we can just mount them at root
// or they will inherently bring their defined paths with them.
app.use(transcriptApp);
app.use(aiApp);

// Health check endpoint for unified deployment
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "Meeting AI Gateway" });
});

app.listen(PORT, () => {
  console.log(`API Gateway running securely on port ${PORT}`);
  console.log(`- POST /api/v1/transcript/process`);
  console.log(`- POST /api/v1/ai/process-transcript`);
});
