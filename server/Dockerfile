# Production Audiveris OMR Container for MUSIQ
FROM eclipse-temurin:17-jdk-jammy

# Install Tesseract OCR, dependencies, and Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libfontconfig1 \
    libxrender1 \
    libxtst6 \
    libxi6 \
    curl \
    unzip \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Download and install Audiveris release
WORKDIR /opt/audiveris
RUN wget -q https://github.com/Audiveris/audiveris/releases/download/5.3.1/audiveris-5.3.1.zip \
    && unzip -q audiveris-5.3.1.zip \
    && rm audiveris-5.3.1.zip \
    && ln -s /opt/audiveris/audiveris-5.3.1/bin/audiveris /usr/local/bin/audiveris

# Setup MUSIQ OMR Server
WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=3001
ENV AUDIVERIS_BIN=/usr/local/bin/audiveris

EXPOSE 3001

CMD ["node", "index.js"]
