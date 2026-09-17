# Production Audiveris OMR Container for MUSIQ
FROM eclipse-temurin:17-jdk-jammy

# Install Tesseract OCR, graphics libraries, and system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libfontconfig1 \
    libxrender1 \
    libxtst6 \
    libxi6 \
    curl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Download and install Audiveris 5.11.0 official Debian package
WORKDIR /tmp
RUN wget -q https://github.com/Audiveris/audiveris/releases/download/5.11.0/Audiveris-5.11.0-ubuntu22.04-x86_64.deb \
    && (dpkg -i Audiveris-5.11.0-ubuntu22.04-x86_64.deb || apt-get install -f -y) \
    && rm -f Audiveris-5.11.0-ubuntu22.04-x86_64.deb

# Ensure audiveris binary is symlinked to /usr/local/bin/audiveris
RUN which audiveris || find / -name "audiveris" -o -name "Audiveris" 2>/dev/null | grep -i bin | head -n 1 | xargs -I {} ln -sf {} /usr/local/bin/audiveris

# Headless Java options to prevent X11 display errors in container batch mode
ENV JAVA_TOOL_OPTIONS="-Djava.awt.headless=true"
ENV PORT=3001
ENV AUDIVERIS_BIN=/usr/local/bin/audiveris

# Setup MUSIQ OMR Server
WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]

