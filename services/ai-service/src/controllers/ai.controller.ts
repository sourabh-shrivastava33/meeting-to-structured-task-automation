import { Request, Response } from "express";
import { aiService } from "../services/openai.service";

export const processTranscript = async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res
        .status(400)
        .json({ error: "Missing transcript data", success: false });
    }

    // Process all AI extraction tasks concurrently
    const [
      actionItemsData,
      blockersData,
      decisionsData,
      risksData,
      summaryData,
    ] = await Promise.all([
      aiService.extractActionItems(transcript),
      aiService.extractBlockers(transcript),
      aiService.extractDecisions(transcript),
      aiService.extractRisks(transcript),
      aiService.generateSummary(transcript),
    ]);

    // Combine all tasks from the different extractions
    const allTasks = [
      ...(actionItemsData.tasks || []),
      ...(blockersData.tasks || []),
      ...(decisionsData.tasks || []),
      ...(risksData.tasks || []),
    ];

    res.status(200).json({
      success: true,
      data: {
        summary: summaryData.summary || "",
        tasks: allTasks,
      },
    });
  } catch (error) {
    console.error("Error processing transcript in AI service:", error);
    res
      .status(500)
      .json({
        error: "Internal server error while processing transcript",
        success: false,
      });
  }
};
