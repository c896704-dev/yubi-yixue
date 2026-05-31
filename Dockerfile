# ── 构建阶段 ──
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 better-sqlite3 编译所需工具
RUN apk add --no-cache python3 make g++

# 安装依赖（含 devDependencies，因为需要编译原生模块）
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码并构建前端
COPY . .
RUN npm run build

# ── 运行阶段 ──
FROM node:20-alpine

WORKDIR /app

# 从构建阶段复制编译好的原生模块和 package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public

EXPOSE 3002

CMD ["node", "server/index.js"]
