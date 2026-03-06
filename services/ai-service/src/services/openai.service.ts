import { OpenAI } from "openai";
import {
  extractActionItemsPrompt,
  extractBlockersPrompt,
  extractDecisionsPrompt,
  extractRisksPrompt,
  generateSummaryPrompt,
} from "../../../../shared/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIService {
  private async queryOpenAI(systemPrompt: string, userContent: string) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Or another appropriate model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    return JSON.parse(content);
  }

  public async extractActionItems(transcriptChunk: string) {
    return this.queryOpenAI(extractActionItemsPrompt, transcriptChunk);
  }

  public async extractBlockers(transcriptChunk: string) {
    return this.queryOpenAI(extractBlockersPrompt, transcriptChunk);
  }

  public async extractDecisions(transcriptChunk: string) {
    return this.queryOpenAI(extractDecisionsPrompt, transcriptChunk);
  }

  public async extractRisks(transcriptChunk: string) {
    return this.queryOpenAI(extractRisksPrompt, transcriptChunk);
  }

  public async generateSummary(transcriptChunk: string) {
    return this.queryOpenAI(generateSummaryPrompt, transcriptChunk);
  }
}

export const aiService = new AIService();
