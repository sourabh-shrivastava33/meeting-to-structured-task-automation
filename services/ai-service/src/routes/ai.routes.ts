import { Router } from "express";
import { processTranscript } from "../controllers/ai.controller";

const router = Router();

router.post("/process-transcript", processTranscript);

export default router;
