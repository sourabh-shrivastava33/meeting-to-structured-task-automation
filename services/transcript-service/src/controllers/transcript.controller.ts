import { Request, Response } from "express";
import { transcriptService } from "../services/transcript.service";

export const processTranscript = (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "Missing transcript" });
    }

    const chunks = transcriptService.process(transcript);

    res.status(200).json({ chunks, success: true });
  } catch (error) {
    console.error("Error processing transcript:", error);
    res.status(500).json({ error: "Internal server error", success: false });
  }
};
