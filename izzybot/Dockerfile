# Imagen base con Node.js 20
FROM node:20-slim

# Instalar Chromium y todas sus dependencias para Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libxkbcommon0 \
    fonts-liberation \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Decirle a Puppeteer que use el Chromium que instalamos
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Instalar dependencias primero (mejor caché)
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Directorio persistente para la sesión de WhatsApp
VOLUME ["/app/.wwebjs_auth"]

CMD ["node", "index.js"]
