import { config } from "dotenv";
import { resolve } from "path";

// Load .env file from the root
config({ path: resolve(__dirname, "../../.env") });

import { aiService } from "./src/services/openai.service";

const demoTranscript = `
John: Hey everyone, thanks for joining. Let's start by discussing the new API integration.
Sarah: I looked into it, and we are blocked on getting the production API keys from the security team. They said it might take until Friday.
Mike: Okay, so we'll push the integration to next week's sprint.
John: Agreed. That's a decision then: API integration is moved to next week. Also, Mike, can you follow up with the security team on Wednesday to ensure they're on track?
Mike: Will do. I'll shoot them an email on Wednesday morning.
Sarah: One more thing, we decided yesterday to use standard REST for this instead of GraphQL, right?
John: Yes, we are locked in on REST for the initial MVP.
`;

async function runDemo() {
  console.log("Running demo with mock transcript...");
  console.log("Transcript:");
  console.log(demoTranscript);
  console.log("--------------------------------------------------");

  try {
    console.log("1. Extracting Action Items...");
    const actionItems = await aiService.extractActionItems(demoTranscript);
    console.log(JSON.stringify(actionItems, null, 2));

    console.log("\n2. Extracting Blockers...");
    const blockers = await aiService.extractBlockers(demoTranscript);
    console.log(JSON.stringify(blockers, null, 2));

    console.log("\n3. Extracting Decisions...");
    const decisions = await aiService.extractDecisions(demoTranscript);
    console.log(JSON.stringify(decisions, null, 2));

    console.log("\n4. Extracting Risks...");
    const risks = await aiService.extractRisks(demoTranscript);
    console.log(JSON.stringify(risks, null, 2));

    console.log("\n5. Generating Summary...");
    const summary = await aiService.generateSummary(demoTranscript);
    console.log(JSON.stringify(summary, null, 2));

    console.log("\nDemo completed magically! ✨");
  } catch (error) {
    console.error("Error during demo execution:");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
  }
}

runDemo();
