# ── frontend/Dockerfile ──────────────────────────────────────────────

# Stage 1 — build React app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Tells React to hit /api/* (proxied by nginx to backend)
ENV REACT_APP_API_URL=/api

RUN npm run build

# Stage 2 — serve with nginx
FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy built React app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
