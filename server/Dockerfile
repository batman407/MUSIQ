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
    && apt-get update \
    && apt-get install -y --no-install-recommends ./Audiveris-5.11.0-ubuntu22.04-x86_64.deb \
    && rm -f Audiveris-5.11.0-ubuntu22.04-x86_64.deb \
    && rm -rf /var/lib/apt/lists/*

# Ensure audiveris binary is accessible via PATH and standard symlinks
RUN ln -sf /opt/audiveris/bin/Audiveris /usr/local/bin/audiveris \
    && ln -sf /opt/audiveris/bin/Audiveris /usr/bin/audiveris \
    && chmod +x /opt/audiveris/bin/Audiveris

# Verify Audiveris binary exists and is executable at build time
RUN test -x /opt/audiveris/bin/Audiveris \
    && test -x /usr/local/bin/audiveris \
    && /opt/audiveris/bin/Audiveris -help \
    && echo "=== Audiveris binary verified successfully ==="

# Headless Java options and environment configuration
ENV JAVA_TOOL_OPTIONS="-Djava.awt.headless=true"
ENV PATH="/opt/audiveris/bin:${PATH}"
ENV AUDIVERIS_BIN=/opt/audiveris/bin/Audiveris
ENV HOME=/root
ENV PORT=3001
ENV NODE_ENV=production

# Setup MUSIQ OMR Server
WORKDIR /app

# Copy server package manifests from repository root build context (server/package*.json)
COPY server/package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --production

# Copy server application source files into /app
COPY server/index.js server/supabase.js ./
COPY server/schema.sql ./

# Create required directories for uploads and jobs
RUN mkdir -p /app/uploads /app/jobs

# Build-time verification: fail the build immediately if required files are missing
RUN test -f /app/index.js \
    && test -f /app/package.json \
    && test -f /app/supabase.js \
    && test -d /app/node_modules \
    && echo "=== Backend runtime files verified in /app ==="

# Use dynamic PORT — cloud hosts (Railway, Render, Fly.io) inject PORT
EXPOSE ${PORT}

# Health check — verify API process and Audiveris availability
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["node", "index.js"]

