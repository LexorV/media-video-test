# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build the SPA (output to dist/spa by default for Quasar)
RUN npm run build


# ---------- Runtime stage ----------
FROM nginx:1.27-alpine

# Copy built assets to nginx html directory
COPY --from=builder /app/dist/spa /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


