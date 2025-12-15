# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL

# Set them as environment variables for the build process
ENV VITE_API_URL=$VITE_API_URL/api
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage - serve with lightweight node server
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 80

# serve with SPA fallback (-s flag handles client-side routing)
CMD ["serve", "-s", "dist", "-l", "80"]