FROM node:20-alpine AS builder

RUN apk add --no-cache openssl
WORKDIR /app

# Placeholder so `prisma generate` can load prisma.config.ts; nothing connects at build time.
# The real DATABASE_URL is supplied at runtime.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3211

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3211
CMD ["node", "server.js"]
