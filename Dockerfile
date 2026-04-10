FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine

RUN apk add --no-cache tini
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY scripts/ ./scripts/

RUN mkdir -p data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/server.js"]
