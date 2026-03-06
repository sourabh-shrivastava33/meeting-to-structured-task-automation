# Developer Guide — Meeting-to-Structured-Task Automation

> **Audience**: Any developer who needs to understand, modify, or extend this codebase.
> **Last Updated**: 2026-03-06

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Repository Structure](#repository-structure)
4. [Monorepo & Workspace Configuration](#monorepo--workspace-configuration)
5. [Services In Depth](#services-in-depth)
   - [API Gateway](#1-api-gateway-servicesapi-gateway)
   - [AI Service](#2-ai-service-servicesai-service)
   - [Transcript Service](#3-transcript-service-servicestranscript-service)
   - [Insight Service (Planned)](#4-insight-service-planned)
   - [Reconciliation Service (Planned)](#5-reconciliation-service-planned)
6. [Shared Modules](#shared-modules)
   - [Prompts](#prompts-sharedprompts)
   - [Types & Schemas](#types--schemas-sharedtypes)
7. [API Endpoint Reference](#api-endpoint-reference)
8. [Authentication & Security](#authentication--security)
9. [Data Flow — End-to-End Request Lifecycle](#data-flow--end-to-end-request-lifecycle)
10. [AI Extraction Pipeline](#ai-extraction-pipeline)
11. [Environment Variables](#environment-variables)
12. [Build, Run & Deploy](#build-run--deploy)
13. [Docker Deployment](#docker-deployment)
14. [Key Design Decisions](#key-design-decisions)
15. [Extending the System](#extending-the-system)

---

## Project Overview

This system transforms unstructured meeting transcripts into structured, actionable intelligence. Given raw meeting text, it:

- **Cleans & chunks** the transcript to fit within LLM token limits.
- **Extracts** five categories of structured insight in parallel using GPT-4o-mini.
- **Returns** a deterministic JSON response containing action items, blockers, decisions, risks, and a professional summary.

The system is designed for mid-sized agencies that need to automatically capture and act on meeting outcomes without manual data entry.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (:3000)                          │
│                     (Unified Entry Point)                              │
│                                                                        │
│   ┌──────────────────────┐      ┌──────────────────────────────────┐   │
│   │   Transcript Service │      │         AI Service               │   │
│   │                      │      │                                  │   │
│   │  POST /api/v1/       │      │  POST /api/v1/ai/               │   │
│   │  transcript/process  │      │  process-transcript              │   │
│   │                      │      │                                  │   │
│   │  ┌────────────────┐  │      │  ┌─────────────────────────────┐ │   │
│   │  │TranscriptService│ │      │  │      AIService (OpenAI)     │ │   │
│   │  │ • clean()       │ │      │  │  • extractActionItems()     │ │   │
│   │  │ • chunk()       │ │      │  │  • extractBlockers()        │ │   │
│   │  │ • deduplicate() │ │      │  │  • extractDecisions()       │ │   │
│   │  │ • normalize()   │ │      │  │  • extractRisks()           │ │   │
│   │  │ • process()     │ │      │  │  • generateSummary()        │ │   │
│   │  └────────────────┘  │      │  └─────────────────────────────┘ │   │
│   └──────────────────────┘      └──────────────────────────────────┘   │
│                                                                        │
│   ┌──────────────────────┐      ┌──────────────────────────────────┐   │
│   │  Insight Service     │      │  Reconciliation Service          │   │
│   │  (Planned)           │      │  (Planned)                       │   │
│   └──────────────────────┘      └──────────────────────────────────┘   │
│                                                                        │
│   GET /health   →   { status: "OK", service: "Meeting AI Gateway" }   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                          ┌─────────┴──────────┐
                          │   Shared Modules    │
                          │ • prompts/          │
                          │ • types/            │
                          │ • utils/ (empty)    │
                          └────────────────────┘
```

---

## Repository Structure

```
meeting-to-structured-task-automation/
├── package.json              # Root workspace config
├── tsconfig.json             # Base TypeScript config (extended by services)
├── Dockerfile                # Multi-stage Docker build for unified deployment
├── .env                      # Environment variables (gitignored)
├── .env.example              # Template for required env vars
│
├── services/
│   ├── api-gateway/          # Unified HTTP entry point (Express)
│   │   ├── src/
│   │   │   └── index.ts      # Mounts transcript + AI apps, health check
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ai-service/           # AI extraction microservice
│   │   ├── src/
│   │   │   ├── index.ts      # Express app with auth middleware
│   │   │   ├── controllers/
│   │   │   │   └── ai.controller.ts
│   │   │   ├── routes/
│   │   │   │   └── ai.routes.ts
│   │   │   └── services/
│   │   │       └── openai.service.ts
│   │   ├── demo.ts           # Standalone demo script
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── transcript-service/   # Transcript pre-processing microservice
│   │   ├── src/
│   │   │   ├── index.ts      # Express app with auth middleware
│   │   │   ├── controllers/
│   │   │   │   └── transcript.controller.ts
│   │   │   ├── routes/
│   │   │   │   └── transcript.routes.ts
│   │   │   └── services/
│   │   │       └── transcript.service.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── insight-service/      # (Planned) Deeper analysis layer
│   │   └── src/              # Scaffolded: controllers/, routes/, services/
│   │
│   └── reconciliation-service/ # (Planned) Board sync layer
│       └── src/              # Scaffolded: controllers/, routes/, services/
│
├── shared/
│   ├── prompts/              # LLM system prompts (5 extraction prompts)
│   │   ├── index.ts
│   │   ├── extract_action_items.prompt.ts
│   │   ├── extract_blockers.prompt.ts
│   │   ├── extract_decisions.prompt.ts
│   │   ├── extract_risks.prompt.ts
│   │   └── generate_summary.prompt.ts
│   ├── types/                # Zod schemas & TypeScript types
│   │   └── index.ts
│   └── utils/                # (Empty — reserved for future utilities)
│
└── docs/
    ├── DEVELOPER_GUIDE.md    # ← You are here
    ├── API_Reference.md
    ├── System_Architecture.md
    ├── Deployment_Guide.md
    └── architecture.png
```

---

## Monorepo & Workspace Configuration

This project uses **npm Workspaces** to manage multiple packages in a single repository.

**Root `package.json` workspace declaration:**

```json
{
  "workspaces": ["services/*", "shared"]
}
```

This means all directories under `services/` and the `shared/` directory are treated as independent npm packages that can import each other by name.

**How inter-service imports work:**

The `api-gateway` declares the other services as **local file dependencies** in its `package.json`:

```json
{
  "dependencies": {
    "transcript-service": "file:../transcript-service",
    "ai-service": "file:../ai-service"
  }
}
```

When `api-gateway/src/index.ts` does `import aiApp from "ai-service"`, npm resolves this to the local `services/ai-service` package, using its `main` and `types` fields to locate the compiled JS and declaration files.

> **Important**: Because `ai-service` imports from `../../shared/` in its `tsconfig.json`, TypeScript computes the rootDir as the monorepo root, which nests the compiled output. Its `package.json` therefore points to `dist/services/ai-service/src/index.js` (not `dist/index.js`). The `transcript-service` does not import shared code in its tsconfig, so its output remains flat at `dist/index.js`.

---

## Services In Depth

### 1. API Gateway (`services/api-gateway`)

**Role**: Unified HTTP entry point. Mounts both microservice Express apps on a single port.

**Key File**: `src/index.ts`

| Aspect | Detail |
|---|---|
| **Port** | `process.env.PORT` or `3000` |
| **Middleware** | None (individual services handle their own auth) |
| **Mounting** | `app.use(transcriptApp)` and `app.use(aiApp)` — services bring their own route paths |
| **Health Check** | `GET /health` → `{ status: "OK", service: "Meeting AI Gateway" }` |

The gateway does **not** add its own authentication layer. Each mounted service enforces its own `Bearer` token check via middleware.

---

### 2. AI Service (`services/ai-service`)

**Role**: Core intelligence engine. Takes a transcript string, runs 5 parallel LLM extractions, and returns structured JSON.

#### File Breakdown

| File | Purpose |
|---|---|
| `src/index.ts` | Creates Express app, adds `express.json({ limit: "50mb" })`, adds auth middleware, mounts routes at `/api/v1/ai` |
| `src/routes/ai.routes.ts` | Single route: `POST /process-transcript` → `processTranscript` controller |
| `src/controllers/ai.controller.ts` | Orchestrates 5 concurrent `aiService.*()` calls via `Promise.all`, merges all `tasks` arrays, returns unified response |
| `src/services/openai.service.ts` | `AIService` class that wraps OpenAI SDK. Uses `gpt-4o-mini`, `temperature: 0.2`, `response_format: json_object`. Exposes 5 public methods |
| `demo.ts` | Standalone CLI demo that processes a hardcoded transcript sample |

#### Internal Code Walkthrough

**`openai.service.ts` — The `AIService` class:**

```typescript
class AIService {
  // Core private method — all extractions route through here
  private async queryOpenAI(systemPrompt: string, userContent: string) {
    // Uses gpt-4o-mini with JSON mode enabled
    // temperature: 0.2 for deterministic outputs
    // Parses response.choices[0].message.content as JSON
  }

  // 5 public extraction methods, each passing a different system prompt:
  public async extractActionItems(transcript: string)  // uses extractActionItemsPrompt
  public async extractBlockers(transcript: string)     // uses extractBlockersPrompt
  public async extractDecisions(transcript: string)    // uses extractDecisionsPrompt
  public async extractRisks(transcript: string)        // uses extractRisksPrompt
  public async generateSummary(transcript: string)     // uses generateSummaryPrompt
}
```

**`ai.controller.ts` — Concurrent extraction orchestrator:**

```typescript
// All 5 extractions fire simultaneously
const [actionItems, blockers, decisions, risks, summary] = await Promise.all([
  aiService.extractActionItems(transcript),
  aiService.extractBlockers(transcript),
  aiService.extractDecisions(transcript),
  aiService.extractRisks(transcript),
  aiService.generateSummary(transcript),
]);

// Tasks from all 4 extraction types are flattened into a single array
const allTasks = [
  ...(actionItems.tasks || []),
  ...(blockers.tasks || []),
  ...(decisions.tasks || []),
  ...(risks.tasks || []),
];
```

---

### 3. Transcript Service (`services/transcript-service`)

**Role**: Pre-processing pipeline for raw meeting transcripts. Cleans, deduplicates, and chunks text to prepare it for LLM consumption.

#### File Breakdown

| File | Purpose |
|---|---|
| `src/index.ts` | Creates Express app, adds auth middleware, mounts routes at `/api/v1/transcript` |
| `src/routes/transcript.routes.ts` | Single route: `POST /process` → `processTranscript` controller |
| `src/controllers/transcript.controller.ts` | Validates request, calls `transcriptService.process()`, returns chunks |
| `src/services/transcript.service.ts` | `TranscriptService` class with cleaning, chunking, and dedup logic |

#### Internal Code Walkthrough

**`transcript.service.ts` — The `TranscriptService` class:**

| Method | Description |
|---|---|
| `clean(transcript)` | Normalizes whitespace, removes timestamps (`[00:00:00]` and `12:34 PM`) |
| `chunk(transcript, maxChunkLength=8000, overlapLength=500)` | Splits long text into overlapping chunks. Tries to break at sentence boundaries (periods). Overlap preserves context across chunks |
| `deduplicate(transcript)` | Removes consecutive duplicate lines |
| `normalizeSpeakers(transcript)` | Hook for future speaker name standardization (currently passthrough) |
| `process(rawTranscript)` | **Orchestrator pipeline**: `deduplicate → clean → normalizeSpeakers → chunk`. Returns `string[]` of processed chunks |

---

### 4. Insight Service (Planned)

> **Status**: Scaffolded only. Directory structure (`src/controllers/`, `src/routes/`, `src/services/`) exists but contains no implementation files.

**Intended Role**: A deeper analysis layer that would provide advanced insights beyond the current extraction (e.g., sentiment analysis, topic categorization, meeting quality scores).

---

### 5. Reconciliation Service (Planned)

> **Status**: Scaffolded only. Directory structure exists but contains no implementation files.

**Intended Role**: Compares extracted action items against an existing task board state (Notion or ClickUp) and produces a reconciliation plan of additions and updates. The `ReconciliationPlanSchema` in `shared/types/` defines the expected output shape.

---

## Shared Modules

### Prompts (`shared/prompts/`)

Five LLM system prompts that instruct GPT-4o-mini on exactly what to extract and in what JSON format.

| Prompt File | AI Target | Output Root Key | Task `type` Field |
|---|---|---|---|
| `extract_action_items.prompt.ts` | Concrete tasks assigned to people | `tasks[]` | `ACTION_ITEM` |
| `extract_blockers.prompt.ts` | Dependencies/issues preventing progress | `tasks[]` | `BLOCKER` |
| `extract_decisions.prompt.ts` | Finalized choices and agreements | `tasks[]` | `DECISION` |
| `extract_risks.prompt.ts` | Potential future issues or threats | `tasks[]` | `RISK` |
| `generate_summary.prompt.ts` | Professional meeting overview | `summary` (string) | N/A |

All task extraction prompts share a **unified task schema**:

```json
{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "type": "ACTION_ITEM | BLOCKER | DECISION | RISK",
      "assignee": "string | null",
      "impact": "string | null",
      "due_date": "string | null",
      "status": "OPEN"
    }
  ]
}
```

### Types & Schemas (`shared/types/`)

All data contracts are defined as **Zod schemas** with inferred TypeScript types. This provides both runtime validation and compile-time type safety.

| Schema | Purpose |
|---|---|
| `TaskSchema` | A single task board item (id, title, description, status, assignee?, due_date?) |
| `BoardSnapshotSchema` | Current state of a Notion/ClickUp board (`tool` + `tasks[]`) |
| `ProcessRequestSchema` | Input: transcript + existing board snapshot |
| `ActionItemSchema` | An extracted action item |
| `BlockerSchema` | An extracted blocker (description + impact) |
| `DecisionSchema` | An extracted decision (decision + reasoning) |
| `InsightsSchema` | Full extraction result: summary + action_items + blockers + decisions |
| `ReconciliationPlanSchema` | Board sync plan: tool + adds[] + updates[] |
| `ProcessResponseSchema` | Complete API response: insights + reconciliation_plan |

---

## API Endpoint Reference

### `GET /health`

Health check for the API Gateway.

| Field | Value |
|---|---|
| **Auth** | None |
| **Response** | `{ "status": "OK", "service": "Meeting AI Gateway" }` |

---

### `POST /api/v1/transcript/process`

Pre-processes a raw transcript into clean, chunked segments.

| Field | Value |
|---|---|
| **Auth** | `Authorization: Bearer <INTERNAL_SERVICE_SECRET>` |
| **Content-Type** | `application/json` |
| **Body Size Limit** | 50 MB |

**Request Body:**

```json
{
  "transcript": "John: Hey everyone...\nSarah: Let's discuss..."
}
```

**Success Response (200):**

```json
{
  "chunks": [
    "John: Hey everyone... Sarah: Let's discuss the new API integration.",
    "Mike: I'll follow up with the security team on Wednesday..."
  ],
  "success": true
}
```

**Error Responses:**

| Code | Body |
|---|---|
| 400 | `{ "error": "Provide the valid secret to access this service", "success": false }` |
| 400 | `{ "error": "Missing transcript" }` |
| 500 | `{ "error": "Internal server error", "success": false }` |

---

### `POST /api/v1/ai/process-transcript`

Runs the full AI extraction pipeline on a transcript.

| Field | Value |
|---|---|
| **Auth** | `Authorization: Bearer <INTERNAL_SERVICE_SECRET>` |
| **Content-Type** | `application/json` |
| **Body Size Limit** | 50 MB |

**Request Body:**

```json
{
  "transcript": "John: Hey everyone, thanks for joining..."
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "summary": "The team discussed the upcoming API integration, which is currently blocked by...",
    "tasks": [
      {
        "title": "Follow up with security team",
        "description": "Send email to security team on Wednesday morning about API keys",
        "type": "ACTION_ITEM",
        "assignee": "Mike",
        "impact": null,
        "due_date": "Wednesday",
        "status": "OPEN"
      },
      {
        "title": "Missing production API keys",
        "description": "Waiting for API keys from the security team, expected by Friday",
        "type": "BLOCKER",
        "assignee": null,
        "impact": "Cannot start the API integration work",
        "due_date": "Friday",
        "status": "OPEN"
      },
      {
        "title": "Use REST over GraphQL for MVP",
        "description": "Team decided to use standard REST instead of GraphQL for the initial MVP",
        "type": "DECISION",
        "assignee": "John",
        "impact": null,
        "due_date": null,
        "status": "OPEN"
      },
      {
        "title": "API integration timeline risk",
        "description": "Integration pushed to next sprint due to API key delays",
        "type": "RISK",
        "assignee": "Project Manager",
        "impact": "Could delay the overall integration timeline",
        "due_date": "Next sprint",
        "status": "OPEN"
      }
    ]
  }
}
```

**Error Responses:**

| Code | Body |
|---|---|
| 400 | `{ "error": "Missing transcript data", "success": false }` |
| 401 | `{ "error": "Provide a valid internal service secret to access the AI service", "success": false }` |
| 500 | `{ "error": "Internal server error while processing transcript", "success": false }` |

---

## Authentication & Security

Both the Transcript Service and AI Service enforce **Bearer token authentication** via middleware in their respective `src/index.ts` files.

```
Authorization: Bearer <INTERNAL_SERVICE_SECRET>
```

- The secret is loaded from `process.env.INTERNAL_SERVICE_SECRET`.
- The API Gateway itself does **not** add its own auth layer — it delegates to each mounted service.
- Requests without a valid token receive a `401` (AI Service) or `400` (Transcript Service) response.

> **Note**: The Transcript Service has a bug where it sends a `400` instead of `401` for auth failures AND does not `return` after sending the error response, which means the request continues to the next middleware. This should be fixed in production.

---

## Data Flow — End-to-End Request Lifecycle

```
Client Request
      │
      ▼
┌─────────────┐
│ API Gateway  │  Receives HTTP request on port 3000
│  (Express)   │  Routes to mounted service based on path prefix
└──────┬──────┘
       │
       ├── /api/v1/transcript/* ──► Transcript Service
       │                              │
       │                              ▼
       │                         TranscriptService.process()
       │                              │
       │                              ├─ 1. deduplicate()  — remove consecutive dupes
       │                              ├─ 2. clean()        — strip timestamps, normalize whitespace
       │                              ├─ 3. normalizeSpeakers() — (passthrough for now)
       │                              └─ 4. chunk()        — split into overlapping segments
       │                              │
       │                              ▼
       │                         Return: string[] of chunks
       │
       └── /api/v1/ai/* ──────► AI Service
                                      │
                                      ▼
                                 Auth middleware check
                                      │
                                      ▼
                                 ai.controller.ts
                                      │
                                      ▼
                                 Promise.all([
                                   extractActionItems(transcript),
                                   extractBlockers(transcript),
                                   extractDecisions(transcript),
                                   extractRisks(transcript),
                                   generateSummary(transcript)
                                 ])
                                      │
                                      ▼
                                 Each calls openai.service.ts → queryOpenAI()
                                      │
                                      ▼
                                 OpenAI GPT-4o-mini (JSON mode, temp=0.2)
                                      │
                                      ▼
                                 Merge all tasks[] + summary → unified response
```

---

## AI Extraction Pipeline

The AI Service uses a **fan-out / fan-in** pattern:

1. **Fan-Out**: The controller fires 5 independent OpenAI API calls simultaneously using `Promise.all`.
2. **LLM Processing**: Each call uses a different system prompt (from `shared/prompts/`) to extract a specific category of information.
3. **Fan-In**: All 5 responses are awaited together, then the `tasks` arrays from 4 extractors are flattened into a single array. The summary is kept as a separate string.

**OpenAI Configuration:**

| Parameter | Value | Rationale |
|---|---|---|
| `model` | `gpt-4o-mini` | Cost-effective for structured extraction |
| `temperature` | `0.2` | Low temperature for deterministic/consistent outputs |
| `response_format` | `{ type: "json_object" }` | Enforces valid JSON output, avoids regex parsing |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | OpenAI API key for GPT-4o-mini calls |
| `INTERNAL_SERVICE_SECRET` | ✅ | Bearer token for inter-service authentication |
| `PORT` | ❌ | API Gateway port (defaults to `3000`) |

**Setup:**

```bash
cp .env.example .env
# Edit .env and add your actual values
```

---

## Build, Run & Deploy

### Prerequisites

- Node.js v20+
- npm v9+

### Install Dependencies

```bash
# From root — installs all workspace dependencies
npm install
```

### Development Mode

```bash
# Run the unified gateway (recommended)
npm run dev:gateway

# Or run individual services
cd services/ai-service && npm run dev
cd services/transcript-service && npm run dev
```

### Production Build

```bash
# Build all workspace packages
npm run build

# Start the gateway
npm run start:gateway
```

> **Build Order Note**: The workspace build runs services in parallel. If `api-gateway` builds before its dependencies, it may fail. Running `npm run build` a second time (or building dependencies first) resolves this. Consider adding a `prebuild` step for production CI.

---

## Docker Deployment

The project includes a multi-stage `Dockerfile` for unified deployment:

```bash
# Build
docker build -t meeting-ai-gateway .

# Run
docker run -p 3000:3000 --env-file .env meeting-ai-gateway
```

**Dockerfile stages:**

| Stage | Purpose |
|---|---|
| `builder` | Copies full source, runs `npm ci` + `npm run build` to compile TypeScript |
| `runner` | Copies only `dist/` folders, `node_modules`, and `package.json` files. Sets `NODE_ENV=production` |

The final image runs `npm run start:gateway` which executes `node services/api-gateway/dist/index.js`.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **npm Workspaces** monorepo | Services share code (prompts, types) while maintaining independent `package.json` and `tsconfig.json` |
| **Concurrent `Promise.all` extraction** | 5 independent LLM calls fire simultaneously, reducing total latency by ~80% vs sequential |
| **JSON mode** in OpenAI | Guarantees parseable JSON output; eliminates fragile regex/text parsing |
| **Low temperature (0.2)** | Ensures consistent, deterministic extraction results across runs |
| **Unified task schema** | All extraction types (action items, blockers, decisions, risks) share the same task shape with a `type` discriminator, enabling uniform downstream processing |
| **Flat service mounting** via `app.use()` | Services define their own routes (`/api/v1/ai/...`), gateway simply mounts them without path rewriting |
| **Service-level auth middleware** | Each service owns its auth logic, rather than centralizing it at the gateway |
| **50MB body limit** | Accommodates large meeting transcripts |

---

## Extending the System

### Adding a New Extraction Type

1. Create a new prompt file in `shared/prompts/` (e.g., `extract_sentiments.prompt.ts`).
2. Export it from `shared/prompts/index.ts`.
3. Add a new public method to `AIService` in `openai.service.ts`.
4. Add the call to `Promise.all` in `ai.controller.ts`.
5. Spread the new tasks into `allTasks`.

### Implementing the Insight Service

1. Add an `index.ts`, controller, route, and service file inside `services/insight-service/src/`.
2. Create a `package.json` and `tsconfig.json` (use `transcript-service` as a template).
3. Import and mount it in `api-gateway/src/index.ts`.

### Implementing the Reconciliation Service

1. Follow the same pattern as above.
2. Use the `BoardSnapshotSchema` and `ReconciliationPlanSchema` from `shared/types/` to define the input/output contracts.
3. The service should accept a transcript + board snapshot and return a reconciliation plan of adds/updates.
