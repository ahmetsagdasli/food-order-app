# Build aşaması
FROM node:20-alpine AS build
WORKDIR /app

# Sadece manifestleri kopyala
# package-lock.json yoksa * kuralı hata vermez
COPY package.json package-lock.json* ./

# Kilit varsa 'npm ci', yoksa 'npm install'
# (peer conflict olursa fallback olarak legacy-peer-deps ile kurar)
RUN if [ -f package-lock.json ]; then \
      npm ci || npm ci --legacy-peer-deps ; \
    else \
      npm install --legacy-peer-deps ; \
    fi

# Kaynakları kopyala ve build et
COPY . .
RUN npm run build

# Serve aşaması
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
