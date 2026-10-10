FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && rm -f dist/*.test.js && npm prune --omit=dev

FROM node:22-alpine
RUN apk add --no-cache chromium
WORKDIR /app
ENV NODE_ENV=production
ENV CHROMIUM_PATH=/usr/bin/chromium
# Chromium's sandbox needs privileges a container doesn't have; the container itself is the isolation.
ENV BROWSER_NO_SANDBOX=1
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3300
CMD ["node", "dist/server.js"]
