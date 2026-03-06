import "dotenv/config";
import express from "express";
import aiRoutes from "./routes/ai.routes";

const app = express();
app.use(express.json({ limit: "50mb" }));

// Basic internal authorization middleware
app.use((req, res, next) => {
  if (
    req.headers.authorization !==
    `Bearer ${process.env.INTERNAL_SERVICE_SECRET}`
  ) {
    return res.status(401).json({
      error: "Provide a valid internal service secret to access the AI service",
      success: false,
    });
  }
  next();
});

app.use("/api/v1/ai", aiRoutes);

export default app;
