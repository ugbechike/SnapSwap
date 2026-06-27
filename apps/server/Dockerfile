FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @snap-swap/shared build && pnpm --filter @snap-swap/server build
EXPOSE 3001
CMD ["pnpm", "--filter", "@snap-swap/server", "start"]
