# API Reference

## AI Service

### \`POST /api/v1/ai/process-transcript\`

Processes a raw meeting transcript and returns a deterministic, structured JSON object containing all the extracted insights (Action Items, Blockers, Decisions, Risks) plus an executive summary.

**Headers**

- \`Authorization\`: \`Bearer <INTERNAL_SERVICE_SECRET>\` (Required)
- \`Content-Type\`: \`application/json\`

**Body schema**

\`\`\`json
{
"transcript": "string (Raw text of the meeting separated by \\n)"
}
\`\`\`

**Success Response (200 OK)**

Returns a unified schema. All individual tasks extracted from the meeting are flattened into a single \`tasks\` array, with the \`type\` field designating what kind of task was extracted.

\`\`\`json
{
"success": true,
"data": {
"summary": "The team aligned on the Q3 priorities and decided to migrate to PostgreSQL...",
"tasks": [
{
"title": "Migrate Database",
"description": "Port MongoDB schema to PostgreSQL format by the end of the current sprint.",
"type": "ACTION_ITEM",
"assignee": "Alice",
"impact": null,
"due_date": "End of Sprint",
"status": "OPEN"
},
{
"title": "Missing API keys",
"description": "Waiting for API keys from third-party vendor",
"type": "BLOCKER",
"assignee": null,
"impact": "Cannot complete the payment gateway integration",
"due_date": null,
"status": "OPEN"
},
{
"title": "Use PostgreSQL",
"description": "Decided to migrate from MongoDB to PostgreSQL for better relational integrity.",
"type": "DECISION",
"assignee": "Tech Lead",
"impact": "Requires rewriting the data access layer",
"due_date": null,
"status": "OPEN"
},
{
"title": "Timeline slippage",
"description": "The current sprint might not finish on time due to unexpected tech debt.",
"type": "RISK",
"assignee": "Project Manager",
"impact": "Could delay the Q3 product launch",
"due_date": "End of sprint",
"status": "OPEN"
}
]
}
}
\`\`\`

**Error Response (400 Bad Request)**

\`\`\`json
{
"success": false,
"error": "Missing transcript data"
}
\`\`\`

**Error Response (401 Unauthorized)**

\`\`\`json
{
"success": false,
"error": "Provide a valid internal service secret to access the AI service"
}
\`\`\`
