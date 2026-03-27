FROM oven/bun:1

# Install MariaDB server (drop-in MySQL replacement, available in Debian repos)
RUN apt-get update && \
    apt-get install -y mariadb-server && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy project files first
COPY . .

RUN chmod +x start.sh

# Install dependencies at build time
RUN bun install --frozen-lockfile --trust-all-scripts

# ── Environment variables ──────────────────────────────────────────────────────
# Non-secret defaults — override at runtime with: docker run -e KEY=value
# DATABASE_URL uses TCP connection to localhost:3306 (inside container)
ENV NODE_ENV=production \
    DATABASE_URL="mysql://framely:framelysecret@127.0.0.1:3306/framely" \
    NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000" \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="" \
    CLERK_SECRET_KEY="" \
    NEXT_PUBLIC_UMAMI_SCRIPT_URL="" \
    NEXT_PUBLIC_UMAMI_WEBSITE_ID=""

EXPOSE 3000

# start.sh will:
# 1. Start MariaDB server
# 2. Create database and user (via init)
# 3. Generate .env with DATABASE_URL
# 4. Sync database schema via prisma db push
# 5. Build and start Next.js app
CMD ["./start.sh"]
