# Stage 1: install prod deps with cache
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# install only production dependencies
RUN npm ci --omit=dev

# Stage 2: runtime image
FROM node:20-alpine
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app

# (optional) tiny curl install for HEALTHCHECK below
RUN apk add --no-cache curl

# copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# copy app source
COPY . .

# run as non-root
RUN adduser -D -H app && chown -R app:app /app
USER app

EXPOSE 4000

# If you have a /health route, keep this. If not, delete the HEALTHCHECK line.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://localhost:4000/health || exit 1

CMD ["node", "server.js"]
