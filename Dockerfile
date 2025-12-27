# Build stage
FROM node:20-slim AS builder

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy built assets and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.cjs ./
COPY --from=builder /app/package.json ./

# Copy data directory with SQLite database
COPY --from=builder /app/data ./data

# Copy uploaded files (covers, etc.)
COPY --from=builder /app/server/uploads ./server/uploads

# Ensure directories exist (in case they're empty in source)
RUN mkdir -p data server/uploads

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server.cjs"]
