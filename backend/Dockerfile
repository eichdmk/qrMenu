FROM node:20-bookworm-slim AS base

WORKDIR /usr/src/app

# Install system dependencies required for native modules such as sharp
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    libvips \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]

