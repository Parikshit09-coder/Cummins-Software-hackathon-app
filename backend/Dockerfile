# ── backend/Dockerfile ──────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Create logs directories so the container has them ready
RUN mkdir -p logs/csv logs/json

EXPOSE 5000

CMD ["node", "server.js"]
