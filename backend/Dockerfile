# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package definition files
COPY package*.json tsconfig.json ./

# Install all dependencies for build
RUN npm ci

# Copy TypeScript source code
COPY src/ ./src/

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Expose port (Railway overrides PORT dynamically)
EXPOSE 3000

# Start Express API server
CMD ["node", "dist/server.js"]
