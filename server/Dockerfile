# ============================================================
# Production Audiveris OMR Container for MUSIQ
# Base: Eclipse Temurin JDK 17 on Ubuntu 22.04 (Jammy)
# Runtime: Node.js 22 LTS + Headless Audiveris 5.11.0 + Tesseract OCR
# ============================================================
FROM eclipse-temurin:17-jdk-jammy

# 1. Install Tesseract OCR, graphics libraries, PDF rendering deps,
# GTK3 (required by Audiveris / Java AWT / JNA headless graphics),
# and core system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libfontconfig1 \
    libfreetype6 \
    libxrender1 \
    libxtst6 \
    libxi6 \
    libopenjp2-7 \
    libasound2 \
    libgtk-3-0 \
    curl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Ensure libgtk-3.so symlinks are present for JNA / native dynamic loader
RUN find /usr/lib -name "libgtk-3.so*" -exec dirname {} \; | sort -u | while read -r dir; do \
      if [ -f "$dir/libgtk-3.so.0" ] && [ ! -f "$dir/libgtk-3.so" ]; then \
        ln -sf "$dir/libgtk-3.so.0" "$dir/libgtk-3.so"; \
      fi; \
    done \
    && (test -f /usr/lib/x86_64-linux-gnu/libgtk-3.so.0 || test -f /usr/lib/libgtk-3.so || dpkg -l libgtk-3-0) \
    && echo "=== GTK-3 runtime verified successfully ==="

# 2. Install Node.js 22 LTS (Official NodeSource distribution)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Build-time verification: strictly enforce Node 22 LTS (fail build if Node 20 or non-22)
RUN node --version && npm --version \
    && (node --version | grep -E "^v22\.") \
    && echo "=== Node 22 LTS verified successfully ==="

# 3. Prepare headless environment for Audiveris (prevent jpackage desktop menu errors)
RUN mkdir -p /usr/share/desktop-directories /usr/share/applications \
    && ln -sf /bin/true /usr/local/bin/xdg-desktop-menu \
    && ln -sf /bin/true /usr/local/bin/xdg-mime \
    && ln -sf /bin/true /usr/local/bin/update-desktop-database

# 4. Download and install Audiveris 5.11.0 official Debian package
WORKDIR /tmp
RUN wget -q https://github.com/Audiveris/audiveris/releases/download/5.11.0/Audiveris-5.11.0-ubuntu22.04-x86_64.deb \
    && (dpkg -i Audiveris-5.11.0-ubuntu22.04-x86_64.deb || dpkg-deb -x Audiveris-5.11.0-ubuntu22.04-x86_64.deb /) \
    && rm -f Audiveris-5.11.0-ubuntu22.04-x86_64.deb

# Ensure audiveris binary is accessible via PATH and standard symlinks
RUN ln -sf /opt/audiveris/bin/Audiveris /usr/local/bin/audiveris \
    && ln -sf /opt/audiveris/bin/Audiveris /usr/bin/audiveris \
    && chmod +x /opt/audiveris/bin/Audiveris

# Verify Audiveris binary exists and is legitimately executable at build time
RUN test -x /opt/audiveris/bin/Audiveris \
    && test -x /usr/local/bin/audiveris \
    && (/opt/audiveris/bin/Audiveris -help 2>&1 || true) | grep -iE "Usage|audiveris|OPTIONS" \
    && echo "=== Audiveris binary verified successfully ==="

# Headless Java options and environment configuration
ENV JAVA_TOOL_OPTIONS="-Djava.awt.headless=true"
ENV PATH="/opt/audiveris/bin:${PATH}"
ENV AUDIVERIS_BIN=/opt/audiveris/bin/Audiveris
ENV HOME=/root
ENV PORT=3001
ENV NODE_ENV=production

# 5. Setup MUSIQ OMR Server
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

# Build-time verification: fail the build immediately if required files or Node 22 missing
RUN test -f /app/index.js \
    && test -f /app/package.json \
    && test -f /app/supabase.js \
    && test -d /app/node_modules \
    && (node --version | grep -E "^v22\.") \
    && echo "=== Backend runtime files and Node 22 verified in /app ==="

# Use dynamic PORT — cloud hosts (Railway, Render, Fly.io) inject PORT
EXPOSE ${PORT}

# Health check — verify API process and Audiveris availability
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["node", "index.js"]
