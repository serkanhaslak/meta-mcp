FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src/ ./src/

# Install typescript for build, build, then remove
RUN npm install typescript@5 && npx tsc && npm uninstall typescript

EXPOSE 3000

CMD ["node", "dist/index.js"]
