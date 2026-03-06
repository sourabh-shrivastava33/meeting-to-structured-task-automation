import { Router } from "express";
import { processTranscript } from "../controllers/transcript.controller";

const router = Router();

router.post("/process", processTranscript);

export default router;
