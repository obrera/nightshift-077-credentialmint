FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN apt-get update \
  && apt-get install -y --no-install-recommends g++ make python3 \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun@1.3.12 \
  && bun install --frozen-lockfile --ignore-scripts \
  && npm rebuild better-sqlite3
COPY . .
RUN bun run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g bun@1.3.12
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/server ./src/server
COPY --from=build /app/src/shared ./src/shared
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "--import", "tsx", "src/server/index.ts"]
