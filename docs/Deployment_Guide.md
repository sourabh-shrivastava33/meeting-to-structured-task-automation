# Deployment Guide

## Prerequisites

1.  **Node.js**: Ensure Node.js (v20+) is installed.
2.  **Environment Variables**: The workspace uses root-level and service-level environment configurations. Ensure the `.env` file contains the required `OPENAI_API_KEY` and `INTERNAL_SERVICE_SECRET`.

## Local Development

The project is structured as an npm workspace.

1.  **Install tools & dependencies**:
    Navigate to the root directory and run:
    \`\`\`bash
    npm install
    \`\`\`

2.  **Start Services for Development**:
    - **AI Service**:
      \`\`\`bash
      cd services/ai-service
      npm run dev
      \`\`\`
    - **Transcript Service**:
      \`\`\`bash
      cd services/transcript-service
      npm run dev
      \`\`\`

## Production Build

To build the microservices for production deployment:

1.  **Compile TypeScript**:
    Run the build script from the root directory to build all workspaces.
    \`\`\`bash

    # From root directory

    npm run build
    \`\`\`
    _This executes `npm run build --workspaces --if-present` which invokes the local `tsc` process in each service directory that has a build script._

2.  **Running Built Artifacts**:
    Once built, simply execute the `dist/index.js` file for a given service.
    \`\`\`bash
    cd services/ai-service
    node dist/index.js
    \`\`\`

## Docker Structure (Optional Roadmap)

The decoupled microservice structure implies standard Dockerization where each service in \`services/\*\` gets its own lightweight Node distribution (e.g., \`node:20-alpine\`) \`Dockerfile\`.
Copy the \`shared/\` folder logically during the build phase of a \`Dockerfile\` so imports like \`../../shared/prompts\` execute properly during \`tsc\`.
Alternatively, deploying as an monorepo using standard serverless deployment platforms (like Vercel or Render) works simply by configuring the workspace entrypoints.
