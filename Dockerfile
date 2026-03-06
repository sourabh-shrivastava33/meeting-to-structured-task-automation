# Use Node 20 alpine for a lightweight image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations and the lockfile
COPY package*.json ./
COPY tsconfig.json ./

# Copy all the workspaces
COPY services ./services
COPY shared ./shared

# Clean install to fetch all dependencies across the monorepo
RUN npm ci

# Build all TypeScript projects across the workspaces
RUN npm run build

# Next stage: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Copy root config
COPY package*.json ./

# Define production environment
ENV NODE_ENV=production

# Copy only the built dist folders, necessary src files, and package configs 
# from the builder to keep the final image small
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/services/api-gateway/package.json ./services/api-gateway/
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist
COPY --from=builder /app/services/transcript-service/package.json ./services/transcript-service/
COPY --from=builder /app/services/transcript-service/dist ./services/transcript-service/dist
COPY --from=builder /app/services/ai-service/package.json ./services/ai-service/
COPY --from=builder /app/services/ai-service/dist ./services/ai-service/dist

# Expose the API Gateway port
EXPOSE 3000

# Start the unified deployment via the API Gateway
CMD ["npm", "run", "start:gateway"]
