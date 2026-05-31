FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Only keep production deps for runtime
RUN npm ci --production

EXPOSE 3002

CMD ["node", "server/index.js"]
