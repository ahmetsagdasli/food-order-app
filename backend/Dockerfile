# --- build stage (opsiyonel: eğer TS/derleme yoksa direkt runtime'a geçebilirsin) ---
FROM node:20-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# app kaynakları
COPY . .

# uploads klasörü hazır olsun
RUN mkdir -p /app/uploads

# healthcheck için curl ekleyelim (opsiyonel)
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "src/server.js"]
