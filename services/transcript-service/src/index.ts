import "dotenv/config";
import express from "express";
import transcriptRoutes from "./routes/transcript.routes";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use((req, res, next) => {
  if (
    req.headers.authorization !==
    `Bearer ${process.env.INTERNAL_SERVICE_SECRET}`
  ) {
    return res.status(401).json({
      error: "Provide the valid secret to access this service",
      success: false,
    });
  }
  next();
});
app.use("/api/v1/transcript", transcriptRoutes);

export default app;
