# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_BASE_PATH
ARG VITE_WEB_URL

# Set them as environment variables for the build process
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_WEB_URL=$VITE_WEB_URL

COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# Production stage - serve with lightweight node server
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 80

# Serve static files only; Nginx handles SPA fallback.
CMD ["serve", "dist", "-l", "80"]
