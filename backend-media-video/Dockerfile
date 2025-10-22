# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install dependencies first (leverage Docker layer cache)
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

# Copy source code
COPY src ./src
COPY views ./views
COPY public ./public

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --omit=dev

EXPOSE 3000

CMD ["npm", "start"]


