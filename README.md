# AI Post-Meeting Execution Infrastructure for Agencies

**Transforming client meetings into structured, verified execution—automatically.**

---

### The Problem: Operational Action Gaps
For mid-sized agencies (20–30 seats), the silent killer of retention is not strategy—it's **execution reliability**.
*   **Lost Context**: Critical action items vanish into Slack threads or lost notes.
*   **Manual Overhead**: Senior account managers waste hours manually updating Notion databases.
*   **Follow-up Friction**: Client recaps are delayed, inconsistent, or missed entirely.
*   **Visibility Black Holes**: Leadership has no way to audit if "agreed" actions were actually "recorded."

This is not just "taking notes." It's a breakdown in the operational supply chain.

---

### The Solution: Agentic Execution Infrastructure
We have built an **AI-powered operational layer** that plugs directly into your meeting lifecycle. It doesn't just "summarize"—it **orchestrates execution**.

The system autonomously:
1.  **Attends** client meetings.
2.  **Extracts** structured deliverables (Action Items, Blockers, Decisions, Risks).
3.  **Reconciles** them against your existing database (preventing duplicates).
4.  **Updates** your Notion execution systems directly.
5.  **Drafts** professional client follow-ups for human approval.

It is an engineer's approach to account management: **Deterministic, Visible, and Scalable.**

---

## Quick Start

### Prerequisites

- Node.js v20+
- npm v9+
- An OpenAI API key

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd meeting-to-structured-task-automation

# Install all workspace dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Edit `.env` with your values:

```env
OPENAI_API_KEY=sk-your-openai-api-key
INTERNAL_SERVICE_SECRET=your-secret-token
PORT=3000
```

### Running

```bash
# Development (with hot-reload)
npm run dev:gateway

# Or build and run for production
npm run build
npm run start:gateway
```

The API Gateway will start on `http://localhost:3000`.

---

## API Usage

All endpoints are served through a single API Gateway on port `3000`.

### Authentication

Both services require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <INTERNAL_SERVICE_SECRET>
```

---

### `GET /health`

Health check endpoint. No authentication required.

```bash
curl http://localhost:3000/health
```

**Response:**

```json
{
  "status": "OK",
  "service": "Meeting AI Gateway"
}
```

---

### `POST /api/v1/ai/process-transcript`

**The primary endpoint.** Sends a meeting transcript through the full AI extraction pipeline and returns structured insights.

#### Request

```bash
curl -X POST http://localhost:3000/api/v1/ai/process-transcript \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_INTERNAL_SECRET" \
  -d '{
    "transcript": "John: Hey everyone, thanks for joining. Let us discuss the new API integration.\nSarah: I looked into it, and we are blocked on getting the production API keys from the security team. They said it might take until Friday.\nMike: Okay, so we will push the integration to next week sprint.\nJohn: Agreed. That is a decision then: API integration is moved to next week. Also, Mike, can you follow up with the security team on Wednesday to ensure they are on track?\nMike: Will do. I will shoot them an email on Wednesday morning.\nSarah: One more thing, we decided yesterday to use standard REST for this instead of GraphQL, right?\nJohn: Yes, we are locked in on REST for the initial MVP."
  }'
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "summary": "The team discussed the upcoming API integration, which is currently blocked by missing production API keys from the security team, expected by Friday. The decision was made to push the integration to next week's sprint. Mike will follow up with the security team on Wednesday. The team also confirmed the decision to use REST over GraphQL for the initial MVP.",
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
        "title": "Use REST for MVP",
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
        "assignee": null,
        "impact": "Could delay the overall integration timeline",
        "due_date": "Next sprint",
        "status": "OPEN"
      }
    ]
  }
}
```

#### Task Types

Every item in the `tasks` array has a `type` field that tells you what was extracted:

| Type | Description |
|---|---|
| `ACTION_ITEM` | A concrete task assigned to someone with an optional deadline |
| `BLOCKER` | A dependency or issue preventing progress (includes `impact`) |
| `DECISION` | A finalized choice or agreement the team committed to |
| `RISK` | A potential future issue or schedule threat (includes `impact`) |

#### Error Responses

| Code | Condition | Response |
|---|---|---|
| `400` | Missing `transcript` in body | `{ "success": false, "error": "Missing transcript data" }` |
| `401` | Invalid/missing Bearer token | `{ "success": false, "error": "Provide a valid internal service secret..." }` |
| `500` | Internal processing error | `{ "success": false, "error": "Internal server error while processing transcript" }` |

---

### `POST /api/v1/transcript/process`

**Optional pre-processing.** Cleans and chunks a large transcript into smaller segments suitable for LLM processing.

#### Request

```bash
curl -X POST http://localhost:3000/api/v1/transcript/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_INTERNAL_SECRET" \
  -d '{
    "transcript": "John: Hey everyone...\nSarah: Let us discuss the new API integration..."
  }'
```

#### Response (200 OK)

```json
{
  "chunks": [
    "John: Hey everyone... Sarah: Let us discuss the new API integration.",
    "Mike: I will follow up with the security team on Wednesday..."
  ],
  "success": true
}
```

#### Processing Pipeline

The transcript service runs these steps in order:

1. **Deduplicate** — Removes consecutive duplicate lines
2. **Clean** — Strips timestamps (`[00:00:00]`, `12:34 PM`), normalizes whitespace
3. **Normalize Speakers** — (Reserved for future use)
4. **Chunk** — Splits into segments of ~8000 characters with 500-character overlap, breaking at sentence boundaries

#### Error Responses

| Code | Condition | Response |
|---|---|---|
| `400` | Missing `transcript` in body | `{ "error": "Missing transcript" }` |
| `400` | Invalid/missing Bearer token | `{ "success": false, "error": "Provide the valid secret..." }` |
| `500` | Internal processing error | `{ "success": false, "error": "Internal server error" }` |

---

## Docker Deployment

```bash
# Build the image
docker build -t meeting-ai-gateway .

# Run
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=sk-your-key \
  -e INTERNAL_SERVICE_SECRET=your-secret \
  meeting-ai-gateway
```

Or using an env file:

```bash
docker run -p 3000:3000 --env-file .env meeting-ai-gateway
```

---

## Architecture Overview

The system is built as a modular set of specialized AI agents, controlled by a central orchestrator.

*   **Execution Orchestrator**: The "brain" that receives the transcript and routes tasks to specialized sub-agents.
*   **Specialized Agents**: 
    *   `ActionItemsAgent`: Task extraction and ownership mapping.
    *   `BlockersAgent`: Risk identification.
    *   `NotionExecutionAgent`: The database driver. Uses tool-calling to mutate Notion rows safely.
    *   `FollowUpAgent`: Communication specialist for client correspondence.
*   **Integration Layer**:
    *   **Slack**: Used as the "Console" for the agency. Logs events, errors, and approvals.
    *   **Notion**: The "State" of the agency. The system treats Notion as a production database, not just a wiki.
    *   **Prisma**: Type-safe ORM for managing internal state and meeting metadata.

> For in-depth architecture documentation, internal code walkthrough, and extension guides, see [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md).

---

### Why This Is Different

| Feature | Standard "AI Note Taker" | **Our Execution Infrastructure** |
| :--- | :--- | :--- |
| **Output** | Long, passive text summaries | **Structured Database Rows (Notion)** |
| **Data Handling** | Text dumps | **Reconciliation & Updates (No Duplicates)** |
| **Workflow** | Ends at "Summary" | **Continues to Execution (Database + Email)** |
| **Control** | None (Auto-send) | **Human-in-the-Loop Slack Gates** |
| **Role** | Assistant | **Infrastructure** |

---

### Business Outcomes for Agencies

1.  **Zero-Defect Operations**: No action item is ever lost between a meeting and the dashboard.
2.  **Immediate Client Trust**: Follow-ups are consistent, accurate, and fast—every single time.
3.  **10 Hours/Week Saved**: Per Account Manager, by removing the manual "Listen → Write → Update Notion → Write Email" loop.
4.  **Auditable Logs**: Managing Partners can see exactly when meetings happened and what execution triggered via Slack logs.

---

### Tech Stack

*   **Runtime**: Node.js & TypeScript
*   **AI Core**: OpenAI GPT-4o-mini (via concurrent pipeline)
*   **Validation**: Zod schemas
*   **Database**: Prisma ORM
*   **Integrations**: Notion API, Slack Web API, Google Meet
*   **Architecture**: Microservices with npm Workspaces, API Gateway pattern
*   **Deployment**: Docker (multi-stage build)

---

### Documentation

| Document | Description |
|---|---|
| [Developer Guide](docs/DEVELOPER_GUIDE.md) | Full architecture, code walkthrough, and extension guide |
| [API Reference](docs/API_Reference.md) | Detailed endpoint documentation |
| [System Architecture](docs/System_Architecture.md) | Component design and data flow |
| [Deployment Guide](docs/Deployment_Guide.md) | Build, run, and deploy instructions |

---

### Future Expansion

This system is the foundation for a total **Autonomous Service Delivery** platform. Future modules will include automated ticket creation in Jira/Linear, calendar scheduling based on blockers, and proactive client health monitoring.
