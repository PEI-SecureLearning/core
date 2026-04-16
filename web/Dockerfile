# Dependencies stage: shared setup
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Development target: hot reload with Vite dev server
FROM deps AS dev
COPY . .
RUN npx @tanstack/router-cli generate --path src/routes
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--", "--force"]

# Build stage: production build
FROM deps AS builder
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

COPY . .
RUN npm run build

# Production stage: serve with lightweight node server
FROM node:20-alpine AS prod

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 80

# Serve the app in SPA mode so client-side routes resolve to index.html.
CMD ["serve", "-s", "dist", "-l", "80"]
