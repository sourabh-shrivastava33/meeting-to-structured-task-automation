export class TranscriptService {
  /**
   * Cleans a transcript by removing redundant timestamps, excessive whitespace,
   * or filler phrases if necessary, while preserving actual content.
   */
  public clean(transcript: string): string {
    // Basic cleaning: normalize whitespace
    let cleaned = transcript.replace(/\s+/g, " ").trim();
    // Optional: add regex for robust timestamp removal if standard format is detected
    // E.g., removing [00:00:00] or 12:34 PM stamps
    cleaned = cleaned.replace(/\[\d{2}:\d{2}:\d{2}\]/g, "");
    cleaned = cleaned.replace(/\b\d{1,2}:\d{2}\s?(AM|PM|am|pm)\b/g, "");
    return cleaned.trim();
  }

  /**
   * Chunks a transcript into smaller pieces if it exceeds a certain length,
   * ensuring that token limits for LLMs are respected.
   * We use a basic overlap strategy to maintain context between chunks.
   */
  public chunk(
    transcript: string,
    maxChunkLength: number = 8000,
    overlapLength: number = 500,
  ): string[] {
    if (transcript.length <= maxChunkLength) {
      return [transcript];
    }

    const chunks: string[] = [];
    let currentIndex = 0;

    while (currentIndex < transcript.length) {
      let endIndex = Math.min(currentIndex + maxChunkLength, transcript.length);

      // Try to find a logical break point (e.g., end of a sentence) near the split
      if (endIndex < transcript.length) {
        const lastPeriod = transcript.lastIndexOf(".", endIndex);
        // Only split if the period is reasonably close to the boundary (within 200 chars)
        if (lastPeriod !== -1 && endIndex - lastPeriod < 200) {
          endIndex = lastPeriod + 1;
        }
      }

      chunks.push(transcript.slice(currentIndex, endIndex).trim());

      // Move current index, subtracting overlap
      currentIndex = endIndex - overlapLength;
      if (currentIndex < 0) {
        currentIndex = 0;
      }

      // Avoid infinite loop if overlap is huge
      if (endIndex >= transcript.length) {
        break;
      }
    }

    return chunks;
  }

  /**
   * Very basic deduplication of identical consecutive lines/utterances if provided as a structured text.
   */
  public deduplicate(transcript: string): string {
    const lines = transcript.split("\n");
    const deduped: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && line !== deduped[deduped.length - 1]) {
        deduped.push(line);
      }
    }
    return deduped.join("\n");
  }

  /**
   * Normalizes speaker names (e.g., standardizing 'Speaker 1:' and 'John Doe:')
   */
  public normalizeSpeakers(transcript: string): string {
    // This is often context-dependent. A simple normalization might just ensure
    // that lines starting with <Name>: are formatted consistently.
    // For now, returning as is, but this hook allows future complex normalization.
    return transcript;
  }

  /**
   * Orchestrates the entire processing pipeline for a raw transcript.
   */
  public process(rawTranscript: string): string[] {
    let processed = this.deduplicate(rawTranscript);
    processed = this.clean(processed);
    processed = this.normalizeSpeakers(processed);
    return this.chunk(processed);
  }
}

export const transcriptService = new TranscriptService();
