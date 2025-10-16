# ===== Base image (lightweight Playwright MCP image) =====
FROM mcr.microsoft.com/playwright/mcp:latest

# ===== Install dependencies =====
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    supervisor \
    x11vnc xvfb fluxbox \
    novnc websockify \
    net-tools curl wget \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ===== Set working directory =====
WORKDIR /app

# ===== Copy Node app and install =====
COPY package*.json ./
RUN npm install --legacy-peer-deps

# ===== Copy source files =====
COPY . .

# ===== Copy Supervisor config =====
# Use Linux-style paths and ensure LF line endings (not CRLF)
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ===== Environment variables =====
ENV DISPLAY=:99
EXPOSE 8831 5901 6901

# ===== Start all processes =====
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]