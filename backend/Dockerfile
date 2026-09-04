# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install git for git-based dependencies (e.g. libsignal-node override)
RUN apk add --no-cache git

# Copy package definition files
COPY package*.json tsconfig.json ./

# Install all dependencies for build
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy TypeScript source code
COPY src/ ./src/

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install git for git-based dependencies
RUN apk add --no-cache git

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install only production dependencies
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi && npm cache clean --force

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Expose port (runtime overrides PORT dynamically)
EXPOSE 3000

# Start Express API server
CMD ["node", "dist/server.js"]
