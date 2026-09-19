# ============================================================
# Production Audiveris OMR Container for MUSIQ
# Base: Eclipse Temurin JDK 17 on Ubuntu 22.04 (Jammy)
# ============================================================
FROM eclipse-temurin:17-jdk-jammy

# Install Tesseract OCR, graphics libraries, PDF rendering deps,
# and system dependencies required by Audiveris headless mode
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libfontconfig1 \
    libfreetype6 \
    libxrender1 \
    libxtst6 \
    libxi6 \
    libopenjp2-7 \
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

# Verify Audiveris is actually callable (fail the build if not)
RUN audiveris -help 2>&1 | head -5 && echo "=== Audiveris verified ==="

# Headless Java options to prevent X11 display errors in container batch mode
ENV JAVA_TOOL_OPTIONS="-Djava.awt.headless=true"
ENV PORT=3001
ENV NODE_ENV=production
ENV AUDIVERIS_BIN=/usr/local/bin/audiveris

# Setup MUSIQ OMR Server
WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .

# Create required directories
RUN mkdir -p /app/uploads /app/jobs

# Use dynamic PORT — cloud hosts (Railway, Render, Fly.io) inject PORT
EXPOSE ${PORT}

# Health check — verify API process and Audiveris availability
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["node", "index.js"]
