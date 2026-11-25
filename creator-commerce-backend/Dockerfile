FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# Keeps the full node_modules (including the `prisma` CLI, a devDependency)
# rather than a fresh --omit=dev install, so `prisma migrate deploy` can run
# at container start without a second, separately-maintained install step.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# Applies any pending migrations before every start, so a fresh deploy (or a
# schema change) never requires a manual migration step on the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
