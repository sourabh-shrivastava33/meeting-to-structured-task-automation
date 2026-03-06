# System Architecture & Flow (A-Z)

## Overview

The Meeting-to-Structured-Task Automation system is an enterprise-grade platform designed to automatically process unstructured meeting transcripts and extract actionable intelligence. Built on a microservices architecture, the system guarantees separation of concerns, scalability, and deterministic API outputs.

## Component Breakdown

### 1. AI Service (\`services/ai-service\`)

The **AI Service** is the central intelligence node of the system. It exposes a unified endpoint (\`POST /api/v1/ai/process-transcript\`) that takes in a raw or cleaned transcript string (separated by \`\\n\`) and concurrently routes it through several specialized Large Language Model (LLM) extraction paths.

**Extraction Targets**:

- **Action Items**: Extracts concrete tasks assigned to individuals.
- **Blockers**: Flags dependencies and critical issues preventing progress.
- **Decisions**: Logs finalized choices and agreements.
- **Risks**: Identifies potential future issues or schedule threats.
- **Summary**: Synthesizes the overall conversation into a business-appropriate summary.

**Unified Output Schema**:
To ensure downstream systems can deterministically consume the AI’s output, all task extractions (Action Items, Blockers, Decisions, Risks) are resolved into a unified \`Task\` interface before being returned. See the API Reference for exact schemas.

### 2. Transcript Service (\`services/transcript-service\`)

The **Transcript Service** is an optional pre-processing node. It exposes \`POST /api/v1/transcript/process\`.

- **Responsibility**: Clean strings, chunk large transcripts to fit within LLM token limits, and deduplicate lines.
- **Usage**: Remote clients can either pass raw transcripts here first to get chunked data, OR send them directly to the AI Service if chunking isn't needed.

### 3. API Gateway / Orchestration

Given the decoupled nature, a standard API Gateway or frontend client coordinates the flow:

1.  **Ingest**: Remote Service sends the raw string (\`\\n\` delimited).
2.  **Optional Prep**: If the transcript is massive, hit the Transcript Service to receive contextual chunks.
3.  **Extraction**: Hit the AI Service with the transcript (or chunks) to extract the structured JSON tasks and summary in one shot.

## Core Design Principles

- **Concurrent Execution**: The AI Service leverages \`Promise.all\` to shoot simultaneous extraction queries, reducing latency by 80% compared to sequential LLM inference.
- **Strict Typing via JSON Mode**: By enforcing strict JSON object output modes through OpenAI (and rigorously testing the prompt instructions), the system avoids fragile regex scraping. Every endpoint returns valid, parsable JSON.
- **Stateless Microservices**: The services maintain no database state themselves (beyond external LLM context), ensuring they can scale horizontally behind a load balancer without data integrity risks.
