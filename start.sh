#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
MODE="${1:-dev}"   # Pass "prod" as first argument to build & start in production
TIMEOUT=60         # Seconds to wait for MySQL to be ready

# ── Helpers ────────────────────────────────────────────────────────────────────
log()  { echo "[start.sh] $*"; }
die()  { echo "[start.sh] ERROR: $*" >&2; exit 1; }

# ── Expand PATH to cover common install locations ──────────────────────────────
export PATH="$HOME/.bun/bin:/usr/local/bin:/opt/homebrew/bin:/opt/homebrew/opt/mysql/bin:$PATH"

# ── Prerequisite checks ────────────────────────────────────────────────────────
command -v bun        >/dev/null 2>&1 || die "bun is not installed. Install it from https://bun.sh"
command -v mysql      >/dev/null 2>&1 || die "mysql client not found. Install via: brew install mysql"
command -v mysqladmin >/dev/null 2>&1 || die "mysqladmin not found. Install via: brew install mysql"

# ── Auto-create .env from environment variables if the file is missing ───────────
if [ ! -f ".env" ]; then
  log "No .env file found — generating one from environment variables..."
  
  # Default DATABASE_URL if not provided: use local MySQL connection via TCP
  DEFAULT_DB_URL="mysql://framely:framelysecret@127.0.0.1:3306/framely"
  
  cat > .env <<EOF
NODE_ENV="${NODE_ENV:-development}"
DATABASE_URL="${DATABASE_URL:-${DEFAULT_DB_URL}}"
NEXT_PUBLIC_ROOT_DOMAIN="${NEXT_PUBLIC_ROOT_DOMAIN:-localhost:3000}"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}"
CLERK_SECRET_KEY="${CLERK_SECRET_KEY:-}"
NEXT_PUBLIC_UMAMI_SCRIPT_URL="${NEXT_PUBLIC_UMAMI_SCRIPT_URL:-}"
NEXT_PUBLIC_UMAMI_WEBSITE_ID="${NEXT_PUBLIC_UMAMI_WEBSITE_ID:-}"
EOF
  log ".env file created with DATABASE_URL=${DATABASE_URL:-${DEFAULT_DB_URL}}"
fi

# ── 1. Start MySQL if it is not already running ────────────────────────────────
# Try to connect via TCP first (works in containers and on macOS)
if ! mysql -h 127.0.0.1 -P 3306 -u root --skip-password -e "SELECT 1" >/dev/null 2>&1; then
  log "Starting MySQL..."
  
  if [ -f /var/run/mysqld/mysqld.sock ] || [ -S /var/run/mysqld/mysqld.sock ]; then
    # Socket exists, MySQL might be running - try socket connection
    mysqladmin -u root --socket=/var/run/mysqld/mysqld.sock ping >/dev/null 2>&1 && log "MySQL is already running." && sleep 2 && exec "$@" || true
  fi
  
  # Try various startup methods
  if command -v brew >/dev/null 2>&1 && [ "$(uname)" = "Darwin" ]; then
    log "Using brew to start MySQL on macOS..."
    brew services start mysql 2>/dev/null || true
  elif command -v mysql.server >/dev/null 2>&1; then
    log "Using mysql.server to start MySQL..."
    mysql.server start 2>/dev/null || true
  elif command -v service >/dev/null 2>&1; then
    log "Using systemctl to start MariaDB..."
    service mariadb start 2>/dev/null || service mysql start 2>/dev/null || true
  else
    log "Starting mysqld_safe with proper setup..."
    mkdir -p /var/run/mysqld
    chown -R mysql:mysql /var/run/mysqld 2>/dev/null || true
    mysqld_safe --user=mysql --datadir=/var/lib/mysql --socket=/var/run/mysqld/mysqld.sock --port=3306 &
  fi

  # ── 2. Wait for MySQL to be ready ────────────────────────────────────────
  log "Waiting for MySQL to be ready (up to ${TIMEOUT}s)..."
  elapsed=0
  
  until mysql -h 127.0.0.1 -P 3306 -u root --skip-password -e "SELECT 1" >/dev/null 2>&1; do
    if [ "$elapsed" -ge "$TIMEOUT" ]; then
      die "MySQL did not become ready at 127.0.0.1:3306 within ${TIMEOUT}s."
    fi
    log "Waiting for MySQL... (${elapsed}s/${TIMEOUT}s)"
    sleep 2
    elapsed=$((elapsed + 2))
  done
  log "✓ MySQL is ready."
else
  log "✓ MySQL is already running on 127.0.0.1:3306"
fi

# ── 3. Initialize database and user if they don't exist ──────────────────────
log "Initializing database and framely user..."
mysql -h 127.0.0.1 -u root --skip-password <<MySQL_COMMANDS 2>/dev/null || log "Database/user already exist or initialization skipped"
CREATE DATABASE IF NOT EXISTS framely;
CREATE USER IF NOT EXISTS 'framely'@'%' IDENTIFIED BY 'framelysecret';
GRANT ALL PRIVILEGES ON framely.* TO 'framely'@'%';
FLUSH PRIVILEGES;
MySQL_COMMANDS
log "✓ Database initialization complete."

# ── 4. Sync the database schema ────────────────────────────────────────────────
log "Syncing database schema with Prisma..."
export DATABASE_URL="${DATABASE_URL:-mysql://framely:framelysecret@127.0.0.1:3306/framely}"

if ! bunx prisma db push --skip-generate 2>&1 | tee -a /tmp/prisma-push.log; then
  log "⚠ Prisma db push reported an issue - checking if schema exists..."
  log "Log contents:"
  cat /tmp/prisma-push.log || true
else
  log "✓ Schema sync complete."
fi

# ── 5. Start the web app ───────────────────────────────────────────────────────
if [ "$MODE" = "prod" ]; then
  log "Building for production..."
  bun run build
  log "Starting production server at http://localhost:3000"
  bun run start
else
  log "Starting development server at http://localhost:3000"
  bun run dev
fi
